-- Build 10: production hardening
-- Apply after the previous build SQL files.

-- Global categories: allow admin-managed categories without a restaurant owner.
alter table public.categories
  alter column restaurant_id drop not null;

create index if not exists categories_name_idx on public.categories(name);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories for all
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

-- Restaurant onboarding should go through admin approval.
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

alter table public.restaurant_applications enable row level security;

drop policy if exists "Applicants can read own applications" on public.restaurant_applications;
create policy "Applicants can read own applications"
on public.restaurant_applications for select
using (applicant_id = auth.uid());

drop policy if exists "Applicants can create applications" on public.restaurant_applications;
create policy "Applicants can create applications"
on public.restaurant_applications for insert
with check (applicant_id = auth.uid());

drop policy if exists "Admins can manage applications" on public.restaurant_applications;
create policy "Admins can manage applications"
on public.restaurant_applications for all
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

-- Keep delivery assignment status and order status synchronized.
create or replace function public.sync_delivery_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'assigned' then
    update public.orders set status = 'ready' where id = new.order_id and status in ('ready','picked_up');
  elsif new.status = 'picked_up' then
    update public.orders set status = 'picked_up' where id = new.order_id;
  elsif new.status = 'on_the_way' then
    update public.orders set status = 'on_the_way' where id = new.order_id;
  elsif new.status = 'delivered' then
    update public.orders set status = 'delivered' where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_delivery_order_status on public.delivery_assignments;
create trigger trg_sync_delivery_order_status
after insert or update of status on public.delivery_assignments
for each row execute function public.sync_delivery_order_status();

-- Create a notification whenever an order status changes.
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications(user_id, title, message, type)
    values (
      new.user_id,
      'Order update',
      'Your order status is now ' || replace(new.status, '_', ' '),
      'order'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_status_change on public.orders;
create trigger trg_notify_order_status_change
after update of status on public.orders
for each row execute function public.notify_order_status_change();
