-- Tadka Food Delivery — Build 13 fresh Supabase migration
-- Run this file in a NEW Supabase project SQL Editor.
-- For an existing project, use the existing schema/build SQL files instead of rerunning this.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('customer','restaurant_staff','rider','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending','confirmed','preparing','ready','picked_up','on_the_way','delivered','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  cuisine text,
  description text,
  image_url text,
  rating numeric(3,2) not null default 0,
  delivery_fee numeric(10,2) not null default 39,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  city text,
  state text,
  postal_code text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(cart_id, menu_item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  address_id uuid references public.addresses(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 39,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  quantity integer not null default 1 check (quantity > 0)
);

create table if not exists public.restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(restaurant_id, user_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, user_id)
);

create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned','picked_up','on_the_way','delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_name text not null,
  cuisine text,
  description text,
  delivery_fee numeric(10,2) not null default 39,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

-- Useful indexes.
create index if not exists restaurants_open_rating_idx on public.restaurants(is_open, rating desc);
create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id, is_available);
create index if not exists orders_customer_idx on public.orders(user_id, created_at desc);
create index if not exists orders_restaurant_idx on public.orders(restaurant_id, created_at desc);
create index if not exists delivery_rider_status_idx on public.delivery_assignments(rider_id, status);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- New-user profile trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep updated_at fields current.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists restaurants_touch_updated_at on public.restaurants;
create trigger restaurants_touch_updated_at before update on public.restaurants for each row execute function public.touch_updated_at();
drop trigger if exists carts_touch_updated_at on public.carts;
create trigger carts_touch_updated_at before update on public.carts for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_updated_at();
drop trigger if exists menu_items_touch_updated_at on public.menu_items;
create trigger menu_items_touch_updated_at before update on public.menu_items for each row execute function public.touch_updated_at();
drop trigger if exists delivery_assignments_touch_updated_at on public.delivery_assignments;
create trigger delivery_assignments_touch_updated_at before update on public.delivery_assignments for each row execute function public.touch_updated_at();

-- Global categories are supported.
alter table public.categories alter column restaurant_id drop not null;

-- RLS baseline.
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.restaurant_staff enable row level security;
alter table public.reviews enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.notifications enable row level security;
alter table public.restaurant_applications enable row level security;

-- Public discovery.
drop policy if exists "Public read open restaurants" on public.restaurants;
create policy "Public read open restaurants" on public.restaurants for select using (is_open = true);

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read available menu" on public.menu_items;
create policy "Public read available menu" on public.menu_items for select using (
  is_available = true and exists (
    select 1 from public.restaurants r where r.id = restaurant_id and r.is_open = true
  )
);

-- Profiles.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Addresses.
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Carts.
drop policy if exists "Users manage own carts" on public.carts;
create policy "Users manage own carts" on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own cart items" on public.cart_items;
create policy "Users manage own cart items" on public.cart_items for all using (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
);

-- Orders and order items.
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders for select using (user_id = auth.uid());

drop policy if exists "Customers create own orders" on public.orders;
create policy "Customers create own orders" on public.orders for insert with check (user_id = auth.uid());

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Reviews.
drop policy if exists "Customers read reviews" on public.reviews;
create policy "Customers read reviews" on public.reviews for select using (true);

drop policy if exists "Customers create delivered reviews" on public.reviews;
create policy "Customers create delivered reviews" on public.reviews for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid() and o.status = 'delivered'
  )
);

-- Notifications.
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Restaurant applications.
drop policy if exists "Applicants read own applications" on public.restaurant_applications;
create policy "Applicants read own applications" on public.restaurant_applications for select using (applicant_id = auth.uid());

drop policy if exists "Applicants create applications" on public.restaurant_applications;
create policy "Applicants create applications" on public.restaurant_applications for insert with check (applicant_id = auth.uid());

-- Delivery assignments: customers can see their own assignment; riders can see their own.
drop policy if exists "Customers read own delivery assignment" on public.delivery_assignments;
create policy "Customers read own delivery assignment" on public.delivery_assignments for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
drop policy if exists "Riders read own assignments" on public.delivery_assignments;
create policy "Riders read own assignments" on public.delivery_assignments for select using (rider_id = auth.uid());
drop policy if exists "Riders update own assignments" on public.delivery_assignments;
create policy "Riders update own assignments" on public.delivery_assignments for update using (rider_id = auth.uid()) with check (rider_id = auth.uid());

-- Order status RPC: centralizes authorization and valid progression.
create or replace function public.advance_order_status(p_order_id uuid, p_next_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  authorized boolean := false;
begin
  select * into current_order from public.orders where id = p_order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;

  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    authorized := true;
  elsif exists (
    select 1 from public.restaurants r
    left join public.restaurant_staff rs on rs.restaurant_id = r.id
    where r.id = current_order.restaurant_id
      and (r.owner_id = auth.uid() or rs.user_id = auth.uid())
  ) and p_next_status in ('confirmed','preparing','ready','cancelled') then
    authorized := true;
  elsif exists (
    select 1 from public.delivery_assignments da
    where da.order_id = p_order_id and da.rider_id = auth.uid()
  ) and p_next_status in ('picked_up','on_the_way','delivered') then
    authorized := true;
  end if;

  if not authorized then raise exception 'Not authorized to advance this order'; end if;
  if current_order.status in ('cancelled','delivered') then raise exception 'Order is already closed'; end if;

  if p_next_status = 'confirmed' and current_order.status <> 'pending' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'preparing' and current_order.status <> 'confirmed' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'ready' and current_order.status <> 'preparing' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'picked_up' and current_order.status <> 'ready' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'on_the_way' and current_order.status <> 'picked_up' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'delivered' and current_order.status <> 'on_the_way' then raise exception 'Invalid status transition'; end if;
  if p_next_status = 'cancelled' and current_order.status not in ('pending','confirmed','preparing') then raise exception 'Invalid cancellation'; end if;

  update public.orders set status = p_next_status where id = p_order_id returning * into current_order;
  return current_order;
end;
$$;

revoke all on function public.advance_order_status(uuid, public.order_status) from public;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;

-- Sync delivery assignment -> order.
create or replace function public.sync_delivery_order_status()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status = 'picked_up' then
    update public.orders set status='picked_up' where id=new.order_id;
  elsif new.status = 'on_the_way' then
    update public.orders set status='on_the_way' where id=new.order_id;
  elsif new.status = 'delivered' then
    update public.orders set status='delivered' where id=new.order_id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_sync_delivery_order_status on public.delivery_assignments;
create trigger trg_sync_delivery_order_status after insert or update of status
on public.delivery_assignments for each row execute function public.sync_delivery_order_status();

-- Customer notification on order status change.
create or replace function public.notify_order_status_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications(user_id,title,message,type)
    values(new.user_id,'Order update','Your order status is now ' || replace(new.status::text,'_',' '),'order');
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_order_status_change on public.orders;
create trigger trg_notify_order_status_change after update of status
on public.orders for each row execute function public.notify_order_status_change();
