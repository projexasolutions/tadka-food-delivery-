-- Build 26: rider experience + live delivery tracking
-- Apply after Build 25.

-- Enforce a strict delivery-assignment state machine at the database boundary.
create or replace function public.validate_delivery_assignment_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (
      (old.status = 'assigned' and new.status = 'picked_up') or
      (old.status = 'picked_up' and new.status = 'on_the_way') or
      (old.status = 'on_the_way' and new.status = 'delivered')
    ) then
      raise exception 'Invalid delivery status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_delivery_assignment_transition on public.delivery_assignments;
create trigger trg_validate_delivery_assignment_transition
before update of status on public.delivery_assignments
for each row execute function public.validate_delivery_assignment_transition();

-- Only admins may change the rider/order relationship after an assignment exists.
create or replace function public.prevent_delivery_reassignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and (new.order_id is distinct from old.order_id or new.rider_id is distinct from old.rider_id)
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Only admins can reassign a delivery';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_delivery_reassignment on public.delivery_assignments;
create trigger trg_prevent_delivery_reassignment
before update of order_id,rider_id on public.delivery_assignments
for each row execute function public.prevent_delivery_reassignment();

-- Enable realtime for the two records that power customer/rider tracking.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_assignments'
  ) then
    alter publication supabase_realtime add table public.delivery_assignments;
  end if;
exception when undefined_object then
  -- Older/local setups may not have the realtime publication yet.
  null;
end $$;

create index if not exists delivery_assignments_order_status_idx
  on public.delivery_assignments(order_id, status);
