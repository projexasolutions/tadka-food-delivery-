-- Build #5: restaurant menu + admin management policies
-- Run after schema.sql in Supabase SQL Editor.

create policy "restaurant owners manage own restaurant"
on public.restaurants for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "restaurant staff read own restaurant menu"
on public.menu_items for select
using (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id and r.owner_id = auth.uid()
  )
);

create policy "restaurant owners manage menu"
on public.menu_items for all
using (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id and r.owner_id = auth.uid()
  )
);

create policy "restaurant owners read restaurant orders"
on public.orders for select
using (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id and r.owner_id = auth.uid()
  )
);

create policy "restaurant owners update restaurant orders"
on public.orders for update
using (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id and r.owner_id = auth.uid()
  )
);

create policy "restaurant owners read restaurant order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_items.order_id and r.owner_id = auth.uid()
  )
);

-- Admin read/update access. Keep the role check in every policy.
create policy "admins read all profiles"
on public.profiles for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins manage restaurants"
on public.restaurants for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins read orders"
on public.orders for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins read menu items"
on public.menu_items for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
