-- Build 14: tighten production authorization.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.review_restaurant_application(p_application_id uuid, p_status text)
returns public.restaurant_applications
language plpgsql security definer set search_path=public as $$
declare a public.restaurant_applications; r public.restaurants;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid status'; end if;
  select * into a from public.restaurant_applications where id=p_application_id for update;
  if a.id is null then raise exception 'Application not found'; end if;
  if a.status <> 'pending' then raise exception 'Application already reviewed'; end if;
  update public.restaurant_applications set status=p_status, reviewed_at=now(), reviewed_by=auth.uid() where id=a.id returning * into a;
  if p_status='approved' then
    update public.profiles set role='restaurant_staff' where id=a.applicant_id;
    insert into public.restaurants(owner_id,name,cuisine,description,delivery_fee,is_open)
    values(a.applicant_id,a.restaurant_name,a.cuisine,a.description,a.delivery_fee,false)
    returning * into r;
  end if;
  return a;
end; $$;
revoke all on function public.review_restaurant_application(uuid,text) from public;
grant execute on function public.review_restaurant_application(uuid,text) to authenticated;

-- Prevent applicants from directly changing application review fields.
drop policy if exists "Applicants create applications" on public.restaurant_applications;
create policy "Applicants create applications" on public.restaurant_applications for insert
with check (applicant_id=auth.uid() and status='pending' and reviewed_by is null and reviewed_at is null);

-- Admin can inspect applications; mutation goes through the security-definer RPC.
drop policy if exists "Admins read applications" on public.restaurant_applications;
create policy "Admins read applications" on public.restaurant_applications for select
using (public.is_admin() or applicant_id=auth.uid());
