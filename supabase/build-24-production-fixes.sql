-- Build 24: production fixes and schema compatibility
-- Apply after the existing Tadka SQL/migrations.
-- This migration is idempotent and keeps the final schema compatible with
-- both the canonical migrations and older build SQL files.

-- -----------------------------------------------------------------------------
-- Notifications compatibility
-- Older Build 8 used body/is_read while the canonical schema uses
-- message/read. Normalize either shape to the canonical columns.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.notifications') is null then
    create table public.notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      title text not null,
      message text not null,
      type text not null default 'system',
      read boolean not null default false,
      created_at timestamptz not null default now()
    );
  else
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='body'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='message'
    ) then
      alter table public.notifications rename column body to message;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='is_read'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='read'
    ) then
      alter table public.notifications rename column is_read to read;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='message'
    ) then
      alter table public.notifications add column message text;
      update public.notifications set message = '' where message is null;
      alter table public.notifications alter column message set not null;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='type'
    ) then
      alter table public.notifications add column type text not null default 'system';
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='notifications' and column_name='read'
    ) then
      alter table public.notifications add column read boolean not null default false;
    end if;
  end if;
end $$;

alter table public.notifications enable row level security;

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
on public.notifications for select
using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Order status / delivery synchronization
-- Assigning a rider must not rewrite the order status. The order is already
-- expected to be `ready`; only actual rider progress changes the order state.
-- -----------------------------------------------------------------------------
create or replace function public.sync_delivery_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'picked_up' then
    update public.orders set status='picked_up' where id=new.order_id and status='ready';
  elsif new.status = 'on_the_way' then
    update public.orders set status='on_the_way' where id=new.order_id and status='picked_up';
  elsif new.status = 'delivered' then
    update public.orders set status='delivered' where id=new.order_id and status='on_the_way';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_delivery_order_status on public.delivery_assignments;
create trigger trg_sync_delivery_order_status
after insert or update of status
on public.delivery_assignments
for each row execute function public.sync_delivery_order_status();

-- Customer order-status notifications use the canonical notifications columns.
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
      'Your order status is now ' || replace(new.status::text, '_', ' '),
      'order'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_status_change on public.orders;
create trigger trg_notify_order_status_change
after update of status
on public.orders
for each row execute function public.notify_order_status_change();

-- -----------------------------------------------------------------------------
-- Payment safety
-- Customers must not be able to write payment_status directly from the
-- browser. Real gateway confirmation should be added as a server-side/RPC
-- operation once Razorpay/Stripe is connected.
-- -----------------------------------------------------------------------------
drop policy if exists "Customers update own orders" on public.orders;

-- Keep the security-definer status RPC available only to authenticated users.
revoke all on function public.advance_order_status(uuid, public.order_status) from public;
grant execute on function public.advance_order_status(uuid, public.order_status) to authenticated;
