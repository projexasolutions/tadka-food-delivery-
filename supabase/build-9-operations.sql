-- Build #9: complete non-payment operational flows.
-- Run after Build 8 schema/policies.

do $$
begin
  if not exists (select 1 from pg_enum where enumlabel='rider' and enumtypid='public.user_role'::regtype) then
    alter type public.user_role add value 'rider';
  end if;
end $$;

-- Admin can manage categories.
create policy "admins manage categories"
on public.categories for all
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Admin can manage profile roles.
create policy "admins update profiles"
on public.profiles for update
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Riders can read the order attached to their assignment.
create policy "riders read assigned orders"
on public.orders for select
using (
  exists (
    select 1 from public.delivery_assignments d
    where d.order_id=orders.id and d.rider_id=auth.uid()
  )
);

-- Customers can read delivery assignment for their own orders.
create policy "customers read own delivery"
on public.delivery_assignments for select
using (
  exists (
    select 1 from public.orders o
    where o.id=delivery_assignments.order_id and o.user_id=auth.uid()
  )
);
