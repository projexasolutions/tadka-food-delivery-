-- Tadka Food Delivery — Build 30 final audit fixes
-- Apply after Build 29.
-- Fixes checkout tampering/partial-order risks by moving cart pricing and
-- order creation into one trusted database transaction.

create or replace function public.create_order_from_cart(
  p_address_line1 text,
  p_phone text,
  p_payment_method text default 'cod'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart public.carts;
  v_order_id uuid;
  v_address_id uuid;
  v_subtotal numeric(10,2);
  v_delivery_fee numeric(10,2);
  v_item_count integer;
  v_valid_item_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_payment_method not in ('cod','online') then
    raise exception 'Invalid payment method';
  end if;
  if nullif(trim(p_address_line1), '') is null then
    raise exception 'Delivery address is required';
  end if;
  if nullif(trim(p_phone), '') is null then
    raise exception 'Phone number is required';
  end if;

  select * into v_cart
  from public.carts
  where user_id = v_user_id
  for update;

  if v_cart.id is null then
    raise exception 'Your cart is empty';
  end if;
  if v_cart.restaurant_id is null then
    raise exception 'Cart has no restaurant';
  end if;

  if not exists (
    select 1 from public.restaurants r
    where r.id = v_cart.restaurant_id and r.is_open = true
  ) then
    raise exception 'This restaurant is currently closed';
  end if;

  select count(*)::integer into v_item_count
  from public.cart_items ci
  where ci.cart_id = v_cart.id;

  if v_item_count = 0 then
    raise exception 'Your cart is empty';
  end if;

  select count(*)::integer into v_valid_item_count
  from public.cart_items ci
  join public.menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = v_cart.id
    and mi.restaurant_id = v_cart.restaurant_id
    and mi.is_available = true
    and ci.quantity > 0;

  if v_valid_item_count <> v_item_count then
    raise exception 'One or more cart items are unavailable or no longer sold by this restaurant';
  end if;

  select coalesce(sum(mi.price * ci.quantity), 0)::numeric(10,2)
    into v_subtotal
  from public.cart_items ci
  join public.menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = v_cart.id;

  select delivery_fee into v_delivery_fee
  from public.restaurants
  where id = v_cart.restaurant_id;

  v_delivery_fee := coalesce(v_delivery_fee, 39);

  insert into public.addresses(user_id, label, address_line, phone)
  values (v_user_id, 'Home', trim(p_address_line1), trim(p_phone))
  returning id into v_address_id;

  insert into public.orders(
    user_id, restaurant_id, address_id, subtotal, delivery_fee,
    payment_method, payment_status
  )
  values (
    v_user_id, v_cart.restaurant_id, v_address_id, v_subtotal, v_delivery_fee,
    p_payment_method, 'pending'
  )
  returning id into v_order_id;

  insert into public.order_items(order_id, menu_item_id, item_name, unit_price, quantity)
  select v_order_id, mi.id, mi.name, mi.price, ci.quantity
  from public.cart_items ci
  join public.menu_items mi on mi.id = ci.menu_item_id
  where ci.cart_id = v_cart.id;

  delete from public.cart_items where cart_id = v_cart.id;

  return v_order_id;
end;
$$;

revoke all on function public.create_order_from_cart(text,text,text) from public, anon;
grant execute on function public.create_order_from_cart(text,text,text) to authenticated;
