-- Tadka Food Delivery — Build 28: payment architecture & failure safety
-- Apply after Build 27.
-- This does NOT charge real money. A trusted gateway webhook/server must
-- confirm payments before payment_status becomes `paid`.

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'pending_gateway',
  gateway_order_id text,
  gateway_payment_id text,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created','processing','paid','failed','refunded')),
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_order_idx
  on public.payment_transactions(order_id, created_at desc);
create index if not exists payment_transactions_user_idx
  on public.payment_transactions(user_id, created_at desc);
create unique index if not exists payment_transactions_gateway_payment_idx
  on public.payment_transactions(provider, gateway_payment_id)
  where gateway_payment_id is not null;

alter table public.payment_transactions enable row level security;

drop policy if exists "Customers read own payment transactions" on public.payment_transactions;
create policy "Customers read own payment transactions"
on public.payment_transactions for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Customers create own payment transaction" on public.payment_transactions;
create policy "Customers create own payment transaction"
on public.payment_transactions for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = (select auth.uid())
      and o.payment_method = 'online'
      and o.payment_status = 'pending'
      and amount = (o.subtotal + o.delivery_fee)
  )
);

-- Keep transaction timestamps consistent.
create or replace function public.touch_payment_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_payment_transaction on public.payment_transactions;
create trigger trg_touch_payment_transaction
before update on public.payment_transactions
for each row execute function public.touch_payment_transaction();

-- A customer can safely create/reuse a pending payment attempt for their own
-- online order. It never marks the order as paid.
create or replace function public.create_payment_intent(p_order_id uuid)
returns public.payment_transactions
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_order public.orders;
  existing_tx public.payment_transactions;
  created_tx public.payment_transactions;
begin
  select * into target_order
  from public.orders
  where id = p_order_id
    and user_id = (select auth.uid())
  for update;

  if target_order.id is null then
    raise exception 'Order not found';
  end if;
  if target_order.payment_method <> 'online' then
    raise exception 'This order does not use online payment';
  end if;
  if target_order.status = 'cancelled' then
    raise exception 'Cancelled orders cannot be paid';
  end if;
  if target_order.payment_status = 'paid' then
    raise exception 'Order is already paid';
  end if;

  select * into existing_tx
  from public.payment_transactions
  where order_id = target_order.id
    and status in ('created','processing')
  order by created_at desc
  limit 1;

  if existing_tx.id is not null then
    return existing_tx;
  end if;

  insert into public.payment_transactions(order_id,user_id,amount,currency,status)
  values (target_order.id,target_order.user_id,
          target_order.subtotal + target_order.delivery_fee,'INR','created')
  returning * into created_tx;

  return created_tx;
end;
$$;

revoke all on function public.create_payment_intent(uuid) from public;
revoke all on function public.create_payment_intent(uuid) from anon;
grant execute on function public.create_payment_intent(uuid) to authenticated;

-- Idempotent webhook-facing helper. It is intentionally NOT executable by
-- browser users. A trusted Edge Function/server should call this using a
-- privileged database connection after verifying the gateway signature.
create or replace function public.record_verified_payment(
  p_provider text,
  p_gateway_payment_id text,
  p_gateway_order_id text,
  p_status text,
  p_failure_code text default null,
  p_failure_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.payment_transactions;
  new_status text := lower(trim(p_status));
  resulting_id uuid;
begin
  if new_status not in ('paid','failed','refunded') then
    raise exception 'Unsupported gateway status';
  end if;
  if coalesce(trim(p_provider),'') = '' or coalesce(trim(p_gateway_payment_id),'') = '' then
    raise exception 'Gateway provider and payment id are required';
  end if;

  select * into tx
  from public.payment_transactions
  where provider = p_provider
    and gateway_payment_id = p_gateway_payment_id
  limit 1;

  if tx.id is null and p_gateway_order_id is not null then
    select * into tx
    from public.payment_transactions
    where provider = p_provider
      and gateway_order_id = p_gateway_order_id
      and status in ('created','processing')
    order by created_at desc
    limit 1;
  end if;

  if tx.id is null then
    raise exception 'Payment transaction not found';
  end if;

  update public.payment_transactions
     set provider = p_provider,
         gateway_payment_id = p_gateway_payment_id,
         gateway_order_id = coalesce(p_gateway_order_id, gateway_order_id),
         status = new_status,
         failure_code = case when new_status = 'failed' then p_failure_code else null end,
         failure_message = case when new_status = 'failed' then p_failure_message else null end,
         metadata = coalesce(p_metadata, '{}'::jsonb)
   where id = tx.id
   returning id into resulting_id;

  update public.orders
     set payment_status = case new_status
       when 'paid' then 'paid'
       when 'failed' then 'failed'
       when 'refunded' then 'refunded'
       else payment_status
     end
   where id = tx.order_id;

  return resulting_id;
end;
$$;

revoke all on function public.record_verified_payment(text,text,text,text,text,text,jsonb) from public;
revoke all on function public.record_verified_payment(text,text,text,text,text,text,jsonb) from anon;
revoke all on function public.record_verified_payment(text,text,text,text,text,text,jsonb) from authenticated;
-- Grant this only to a trusted backend role when your deployment uses one.
-- The default migration intentionally leaves it unreachable from browser RPC.

-- Ensure the payment status remains visible through Realtime for order tracking.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payment_transactions'
  ) then
    alter publication supabase_realtime add table public.payment_transactions;
  end if;
exception when undefined_object then
  null;
end $$;
