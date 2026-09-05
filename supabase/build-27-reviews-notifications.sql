-- Build 27: reviews, notifications, and edge-case hardening
-- Apply after Build 26.

-- A review must always belong to the restaurant that owns the reviewed order.
drop trigger if exists trg_validate_review on public.reviews;
create or replace function public.validate_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  order_user uuid;
  order_restaurant uuid;
  order_status public.order_status;
begin
  select user_id, restaurant_id, status
    into order_user, order_restaurant, order_status
  from public.orders where id = new.order_id;

  if order_user is null then raise exception 'Order not found'; end if;
  if order_user <> new.user_id then raise exception 'Review user must own the order'; end if;
  if order_restaurant <> new.restaurant_id then raise exception 'Review restaurant does not match order'; end if;
  if order_status <> 'delivered' then raise exception 'Only delivered orders can be reviewed'; end if;
  if new.rating < 1 or new.rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  return new;
end;
$$;
create trigger trg_validate_review
before insert or update on public.reviews
for each row execute function public.validate_review();

-- Notify restaurant owner/staff when a customer submits feedback.
create or replace function public.notify_restaurant_new_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  restaurant_owner uuid;
  restaurant_name text;
begin
  select owner_id, name into restaurant_owner, restaurant_name
  from public.restaurants where id = new.restaurant_id;

  if restaurant_owner is not null then
    insert into public.notifications(user_id,title,message,type)
    values (
      restaurant_owner,
      'New customer review',
      'A customer rated ' || coalesce(restaurant_name,'your restaurant') || ' ' || new.rating || '/5.',
      'review'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_restaurant_new_review on public.reviews;
create trigger trg_notify_restaurant_new_review
after insert on public.reviews
for each row execute function public.notify_restaurant_new_review();

-- Keep order notifications useful: do not generate duplicates when an update
-- writes the same status, and use canonical notification columns.
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications(user_id,title,message,type)
    values (
      new.user_id,
      case when new.status = 'delivered' then 'Order delivered' else 'Order update' end,
      case when new.status = 'delivered'
        then 'Your order has been delivered. You can now leave a review.'
        else 'Your order status is now ' || replace(new.status::text,'_',' ')
      end,
      'order'
    );
  end if;
  return new;
end;
$$;

-- Notification cleanup is user-scoped and safe to invoke from the client.
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare changed integer;
begin
  update public.notifications
     set read = true
   where user_id = auth.uid() and read = false;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Indexes for the notification center and review lookups.
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read, created_at desc);
create index if not exists reviews_restaurant_created_idx
  on public.reviews(restaurant_id, created_at desc);

-- Defense in depth: clients can only insert reviews for themselves and the
-- trigger above verifies the order/restaurant relationship.
drop policy if exists "Customers create delivered reviews" on public.reviews;
drop policy if exists "Customers can create reviews" on public.reviews;
create policy "Customers create delivered reviews"
on public.reviews for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
      and o.status = 'delivered'
      and o.restaurant_id = restaurant_id
  )
);
