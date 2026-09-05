-- Tadka Food Delivery — Build 29: production security + consistency QA
-- Apply after Build 28.

-- Delivery assignments must never be ahead of their parent order.
create or replace function public.validate_delivery_assignment_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o_status public.order_status;
begin
  select status into o_status from public.orders where id = new.order_id;
  if o_status is null then raise exception 'Order not found'; end if;

  if new.status = 'assigned' and o_status <> 'ready' then
    raise exception 'Assigned delivery requires a ready order';
  elsif new.status = 'picked_up' and o_status <> 'picked_up' then
    raise exception 'Picked-up delivery requires a picked-up order';
  elsif new.status = 'on_the_way' and o_status <> 'on_the_way' then
    raise exception 'On-the-way delivery requires an on-the-way order';
  elsif new.status = 'delivered' and o_status <> 'delivered' then
    raise exception 'Delivered assignment requires a delivered order';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_delivery_assignment_consistency on public.delivery_assignments;
create trigger trg_validate_delivery_assignment_consistency
after insert or update on public.delivery_assignments
for each row execute function public.validate_delivery_assignment_consistency();

-- Keep online-payment orders from being treated as paid unless the trusted
-- payment ledger has a verified paid transaction.
create or replace function public.validate_order_payment_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid' and not exists (
    select 1 from public.payment_transactions pt
    where pt.order_id = new.id and pt.status = 'paid'
  ) then
    raise exception 'Paid orders require a verified payment transaction';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_order_payment_consistency on public.orders;
create trigger trg_validate_order_payment_consistency
before insert or update of payment_status on public.orders
for each row execute function public.validate_order_payment_consistency();

-- Verified payment callback is the only path allowed to mark an order paid.
-- Keep the helper inaccessible to browser roles; deployment-specific trusted
-- backend credentials should be granted separately.
revoke all on function public.record_verified_payment(text,text,text,text,text,text,jsonb) from public, anon, authenticated;

-- Useful indexes for the final operational screens.
create index if not exists orders_status_created_idx
  on public.orders(status, created_at desc);
create index if not exists orders_user_created_idx
  on public.orders(user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications(user_id, created_at desc)
  where read = false;

-- Avoid stale/duplicate active delivery assignments for the same order.
create unique index if not exists delivery_assignments_active_order_idx
  on public.delivery_assignments(order_id)
  where status in ('assigned','picked_up','on_the_way');
