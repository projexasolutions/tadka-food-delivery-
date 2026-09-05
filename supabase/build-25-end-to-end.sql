-- Build 25: end-to-end customer -> restaurant -> rider -> delivered flow
-- Apply after Build 24.

-- Admins need to assign/reassign riders. Customers and riders keep their
-- existing row-level access.
drop policy if exists "Admins manage delivery assignments" on public.delivery_assignments;
create policy "Admins manage delivery assignments"
on public.delivery_assignments
for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Assignment is only valid for a ready order and must target a rider profile.
drop trigger if exists trg_validate_delivery_assignment on public.delivery_assignments;
create or replace function public.validate_delivery_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  order_status public.order_status;
  rider_role text;
begin
  select status into order_status from public.orders where id = new.order_id;
  if order_status is null then raise exception 'Order not found'; end if;
  if order_status not in ('ready','picked_up','on_the_way') then
    raise exception 'Only ready or active delivery orders can be assigned';
  end if;
  select role into rider_role from public.profiles where id = new.rider_id;
  if rider_role <> 'rider' then raise exception 'Selected user is not a rider'; end if;
  return new;
end;
$$;
create trigger trg_validate_delivery_assignment
before insert or update of order_id,rider_id,status
on public.delivery_assignments
for each row execute function public.validate_delivery_assignment();

-- Keep assignment status and order status in lockstep without allowing an
-- assignment update to skip the required order lifecycle.
create or replace function public.sync_delivery_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'picked_up' then
    if not exists (select 1 from public.orders where id = new.order_id and status = 'ready') then
      raise exception 'Order must be ready before pickup';
    end if;
    update public.orders set status = 'picked_up' where id = new.order_id;
  elsif new.status = 'on_the_way' then
    if not exists (select 1 from public.orders where id = new.order_id and status = 'picked_up') then
      raise exception 'Order must be picked up before going on the way';
    end if;
    update public.orders set status = 'on_the_way' where id = new.order_id;
  elsif new.status = 'delivered' then
    if not exists (select 1 from public.orders where id = new.order_id and status = 'on_the_way') then
      raise exception 'Order must be on the way before delivery';
    end if;
    update public.orders set status = 'delivered' where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_delivery_order_status on public.delivery_assignments;
create trigger trg_sync_delivery_order_status
after insert or update of status
on public.delivery_assignments
for each row execute function public.sync_delivery_order_status();

-- Prevent duplicate review attempts at the database boundary with a clear
-- application error while retaining the unique(order_id,user_id) constraint.
create or replace function public.can_review_order(p_order_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and o.user_id = auth.uid()
      and o.status = 'delivered'
  );
$$;
revoke all on function public.can_review_order(uuid) from public;
grant execute on function public.can_review_order(uuid) to authenticated;
