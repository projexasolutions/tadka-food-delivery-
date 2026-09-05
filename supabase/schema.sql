-- Tadka Food Delivery - Supabase schema + role-aware RLS
create extension if not exists pgcrypto;

do $$ begin create type public.user_role as enum ('customer','restaurant_staff','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum ('pending','confirmed','preparing','ready','picked_up','on_the_way','delivered','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text, role public.user_role not null default 'customer', created_at timestamptz not null default now());
create table if not exists public.restaurants (id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id), name text not null, description text, cuisine text, rating numeric(2,1) default 4.5, delivery_fee numeric(10,2) default 39, is_open boolean default true, created_at timestamptz not null default now());
create table if not exists public.categories (id uuid primary key default gen_random_uuid(), restaurant_id uuid references public.restaurants(id) on delete cascade, name text not null, created_at timestamptz default now());
create table if not exists public.menu_items (id uuid primary key default gen_random_uuid(), restaurant_id uuid references public.restaurants(id) on delete cascade, category_id uuid references public.categories(id) on delete set null, name text not null, description text, price numeric(10,2) not null, image_url text, is_available boolean default true, created_at timestamptz default now());
create table if not exists public.addresses (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, label text, address_line text not null, city text, pincode text, phone text, created_at timestamptz default now());
create table if not exists public.carts (id uuid primary key default gen_random_uuid(), user_id uuid unique references public.profiles(id) on delete cascade, restaurant_id uuid references public.restaurants(id), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid references public.carts(id) on delete cascade, menu_item_id uuid references public.menu_items(id) on delete cascade, quantity int not null default 1 check(quantity>0), unique(cart_id,menu_item_id));
create table if not exists public.orders (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), restaurant_id uuid references public.restaurants(id), address_id uuid references public.addresses(id), status public.order_status not null default 'pending', subtotal numeric(10,2) not null default 0, delivery_fee numeric(10,2) not null default 0, total_amount numeric(10,2) generated always as (subtotal+delivery_fee) stored, payment_method text default 'cod', created_at timestamptz default now());
create table if not exists public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete cascade, menu_item_id uuid references public.menu_items(id), item_name text not null, unit_price numeric(10,2) not null, quantity int not null check(quantity>0));
create table if not exists public.restaurant_staff (id uuid primary key default gen_random_uuid(), restaurant_id uuid references public.restaurants(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, unique(restaurant_id,user_id));

create index if not exists restaurants_owner_idx on public.restaurants(owner_id); create index if not exists menu_restaurant_idx on public.menu_items(restaurant_id); create index if not exists orders_user_idx on public.orders(user_id); create index if not exists orders_restaurant_idx on public.orders(restaurant_id);

alter table public.profiles enable row level security; alter table public.restaurants enable row level security; alter table public.categories enable row level security; alter table public.menu_items enable row level security; alter table public.addresses enable row level security; alter table public.carts enable row level security; alter table public.cart_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.restaurant_staff enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create or replace function public.can_manage_restaurant(rid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.restaurants r where r.id=rid and r.owner_id=auth.uid()) or exists(select 1 from public.restaurant_staff s where s.restaurant_id=rid and s.user_id=auth.uid()) or public.is_admin() $$;

-- Customer/self policies
create policy "profiles self read" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create policy "restaurants public read" on public.restaurants for select using(is_open=true or owner_id=auth.uid() or public.is_admin() or exists(select 1 from public.restaurant_staff s where s.restaurant_id=id and s.user_id=auth.uid()));
create policy "restaurants manage" on public.restaurants for all to authenticated using(owner_id=auth.uid() or public.is_admin()) with check(owner_id=auth.uid() or public.is_admin());
create policy "categories public read" on public.categories for select using(exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_open=true) or public.can_manage_restaurant(restaurant_id));
create policy "categories manage" on public.categories for all to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy "menu public read" on public.menu_items for select using((is_available=true and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_open=true)) or public.can_manage_restaurant(restaurant_id));
create policy "menu manage" on public.menu_items for all to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy "addresses own" on public.addresses for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy "carts own" on public.carts for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy "cart items own" on public.cart_items for all to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and (c.user_id=auth.uid() or public.is_admin()))) with check(exists(select 1 from public.carts c where c.id=cart_id and (c.user_id=auth.uid() or public.is_admin())));
create policy "orders customer read" on public.orders for select to authenticated using(user_id=auth.uid() or public.can_manage_restaurant(restaurant_id));
create policy "orders customer insert" on public.orders for insert to authenticated with check(user_id=auth.uid());
create policy "orders manage status" on public.orders for update to authenticated using(public.can_manage_restaurant(restaurant_id) or user_id=auth.uid() or public.is_admin()) with check(public.can_manage_restaurant(restaurant_id) or user_id=auth.uid() or public.is_admin());
create policy "order items read" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.can_manage_restaurant(o.restaurant_id))));
create policy "order items insert" on public.order_items for insert to authenticated with check(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "staff manage" on public.restaurant_staff for all to authenticated using(public.is_admin() or exists(select 1 from public.restaurants r where r.id=restaurant_id and r.owner_id=auth.uid())) with check(public.is_admin() or exists(select 1 from public.restaurants r where r.id=restaurant_id and r.owner_id=auth.uid()));
create policy "admin profiles" on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin categories" on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin menu" on public.menu_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin orders" on public.orders for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin order items" on public.order_items for all to authenticated using(public.is_admin()) with check(public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
