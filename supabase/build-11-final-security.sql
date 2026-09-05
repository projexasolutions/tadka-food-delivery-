-- Build 11: final QA + security hardening
-- Apply after Build 10 SQL.

-- Helpful indexes.
create index if not exists restaurant_applications_applicant_idx
  on public.restaurant_applications(applicant_id, created_at desc);

create index if not exists delivery_assignments_rider_idx
  on public.delivery_assignments(rider_id, status);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

-- Restrict profile updates: users can update only their own basic profile fields.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Admin role changes remain possible through the admin policy already introduced in Build 9.
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (true);

-- Secure order-status progression.
create or replace function public.advance_order_status(p_order_id uuid, p_next_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  allowed boolean := false;
begin
  select * into current_order from public.orders where id = p_order_id for update;

  if current_order.id is null then
    raise exception 'Order not found';
  end if;

  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    allowed := true;
  elsif exists (
    select 1 from public.restaurants r
    left join public.restaurant_staff rs on rs.restaurant_id = r.id
    where r.id = current_order.restaurant_id
      and (r.owner_id = auth.uid() or rs.user_id = auth.uid())
  ) and p_next_status in ('confirmed','preparing','ready','cancelled') then
    allowed := true;
  elsif exists (
    select 1 from public.delivery_assignments da
    where da.order_id = p_order_id and da.rider_id = auth.uid()
  ) and p_next_status in ('picked_up','on_the_way','delivered') then
    allowed := true;
  end if;

  if not allowed then
    raise exception 'Not authorized to advance this order';
  end if;

  if current_order.status = 'cancelled' or current_order.status = 'delivered' then
    raise exception 'Order is already closed';
  end if;

  if p_next_status = 'confirmed' and current_order.status <> 'pending' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'preparing' and current_order.status <> 'confirmed' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'ready' and current_order.status <> 'preparing' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'picked_up' and current_order.status <> 'ready' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'on_the_way' and current_order.status <> 'picked_up' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'delivered' and current_order.status <> 'on_the_way' then
    raise exception 'Invalid status transition';
  elsif p_next_status = 'cancelled' and current_order.status not in ('pending','confirmed','preparing') then
    raise exception 'Invalid cancellation';
  end if;

  update public.orders set status = p_next_status where id = p_order_id
  returning * into current_order;

  return current_order;
end;
$$;

revoke all on function public.advance_order_status(uuid, public.order_status) from public;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;

-- Ensure customers cannot insert reviews before delivery at DB level.
drop policy if exists "Customers can create reviews" on public.reviews;
create policy "Customers can create reviews"
on public.reviews for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
      and o.status = 'delivered'
  )
);

-- Notification read-state policy.
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
