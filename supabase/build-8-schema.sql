-- Build #8: operations, analytics and notifications.
-- Run after Build 7 schema/policies.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users read own notifications"
on public.notifications for select
using (user_id = auth.uid());

create policy "users update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admins manage notifications"
on public.notifications for all
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

create index if not exists idx_orders_restaurant_status
on public.orders(restaurant_id, status);

create index if not exists idx_orders_created
on public.orders(created_at desc);
