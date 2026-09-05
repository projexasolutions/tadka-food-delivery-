-- Build #6 hardening
-- Run after schema.sql and build-5-policies.sql.

-- Customers can read their saved addresses.
create policy "customers read own addresses"
on public.addresses for select
using (user_id = auth.uid());

-- Restaurant owners/staff can read order items belonging to their restaurant.
create policy "restaurant owners read order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_items.order_id
      and r.owner_id = auth.uid()
  )
);

-- Admins can inspect order items for support/operations.
create policy "admins read order items"
on public.order_items for select
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Admins can inspect categories and menu data.
create policy "admins read categories"
on public.categories for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Restaurant owners can read their own staff records.
create policy "restaurant owners read staff"
on public.restaurant_staff for select
using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_staff.restaurant_id
      and r.owner_id = auth.uid()
  )
);
