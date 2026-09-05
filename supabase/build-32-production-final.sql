-- Tadka Food Delivery — Build 32 production finalization
-- Apply after the existing Build 30 security/audit SQL.
-- This migration closes two final authorization/consistency gaps:
-- 1. Delivery status validation now runs before the order-sync trigger.
-- 2. Riders may only change delivery status, not assignment ownership/data.

-- -----------------------------------------------------------------------------
-- Delivery status validation
-- The order-sync trigger advances the parent order after this trigger runs.
-- Therefore validation must compare the new assignment state with the order's
-- current state, not the already-synced state.
-- -----------------------------------------------------------------------------
create or replace function public.validate_delivery_assignment_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order_status public.order_status;
begin
  select status
    into current_order_status
  from public.orders
  where id = new.order_id;

  if current_order_status is null then
    raise exception 'Order not found';
  end if;

  if new.status = 'assigned' and current_order_status <> 'ready' then
    raise exception 'Assigned delivery requires a ready order';
  elsif new.status = 'picked_up' and current_order_status <> 'ready' then
    raise exception 'Order must be ready before pickup';
  elsif new.status = 'on_the_way' and current_order_status <> 'picked_up' then
    raise exception 'Order must be picked up before going on the way';
  elsif new.status = 'delivered' and current_order_status <> 'on_the_way' then
    raise exception 'Order must be on the way before delivery';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_delivery_assignment_consistency on public.delivery_assignments;
create trigger trg_validate_delivery_assignment_consistency
before insert or update of status,order_id,rider_id
on public.delivery_assignments
for each row execute function public.validate_delivery_assignment_consistency();

-- -----------------------------------------------------------------------------
-- Riders can progress their own assignment, but cannot mutate ownership or
-- bookkeeping columns through the generic UPDATE policy.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_rider_assignment_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'rider'
     ) then
    if new.id is distinct from old.id
       or new.order_id is distinct from old.order_id
       or new.rider_id is distinct from old.rider_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Riders may only update delivery status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_rider_assignment_mutation on public.delivery_assignments;
create trigger trg_prevent_rider_assignment_mutation
before update on public.delivery_assignments
for each row execute function public.prevent_rider_assignment_mutation();

-- Keep the final delivery indexes idempotent for production deploys.
create index if not exists delivery_assignments_rider_status_idx
  on public.delivery_assignments(rider_id, status, created_at desc);

-- Explicitly document the browser-facing function boundary.
revoke all on function public.validate_delivery_assignment_consistency() from public;
revoke all on function public.prevent_rider_assignment_mutation() from public;


-- -----------------------------------------------------------------------------
-- Profile role integrity
-- A self-update policy is intentionally kept for name/phone edits, but role
-- changes must remain an administrator-only operation. This trigger closes the
-- privilege-escalation path without requiring application-specific column ACLs.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id
     and new.role is distinct from old.role
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'Only administrators can change account roles';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
before update of role on public.profiles
for each row execute function public.prevent_self_role_escalation();

revoke all on function public.prevent_self_role_escalation() from public;

-- -----------------------------------------------------------------------------
-- Canonical checkout compatibility
-- Build 30 must use the canonical schema column names. Keep this guard here so
-- deployments applying the final migration set cannot silently ship a stale
-- checkout function definition.
-- -----------------------------------------------------------------------------
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

  if v_cart.id is null then raise exception 'Your cart is empty'; end if;
  if v_cart.restaurant_id is null then raise exception 'Cart has no restaurant'; end if;

  if not exists (
    select 1 from public.restaurants r
    where r.id = v_cart.restaurant_id and r.is_open = true
  ) then
    raise exception 'This restaurant is currently closed';
  end if;

  select count(*)::integer into v_item_count
  from public.cart_items ci where ci.cart_id = v_cart.id;

  if v_item_count = 0 then raise exception 'Your cart is empty'; end if;

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

  select coalesce(delivery_fee, 39) into v_delivery_fee
  from public.restaurants where id = v_cart.restaurant_id;

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
