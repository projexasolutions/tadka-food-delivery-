-- Build #7: payment, reviews, and delivery assignment foundation.
-- Run after schema.sql + previous Build 5/6 SQL.

alter table public.orders
  add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending','paid','failed','refunded'));

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, user_id)
);

create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'assigned'
    check (status in ('assigned','picked_up','on_the_way','delivered')),
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
alter table public.delivery_assignments enable row level security;

create policy "customers create own reviews"
on public.reviews for insert
with check (user_id = auth.uid());

create policy "customers read own reviews"
on public.reviews for select
using (user_id = auth.uid());

create policy "riders read own assignments"
on public.delivery_assignments for select
using (rider_id = auth.uid());

create policy "riders update own assignments"
on public.delivery_assignments for update
using (rider_id = auth.uid())
with check (rider_id = auth.uid());

create policy "admins manage reviews"
on public.reviews for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins manage delivery assignments"
on public.delivery_assignments for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
