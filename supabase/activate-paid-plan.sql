-- Activate a customer after payment is verified (Starter, Growth, or Scale).
-- Run in Supabase → SQL Editor.
--
-- 1. Check pending payments:
--    select * from public.our_database_checkouts where submission_status = 'pending';
-- 2. Change customer_email + paid_plan below, then Run.

do $$
declare
  customer_email text := 'email-pelanggan@example.com';
  paid_plan text := 'growth'; -- starter | growth | scale
  target_org_id uuid;
  target_submission_id uuid;
begin
  if paid_plan not in ('starter', 'growth', 'scale') then
    raise exception 'paid_plan must be starter, growth, or scale';
  end if;

  select o.id
  into target_org_id
  from public.organizations o
  join public.org_members om on om.org_id = o.id
  join auth.users u on u.id = om.user_id
  where lower(u.email) = lower(customer_email)
  order by om.created_at asc
  limit 1;

  if target_org_id is null then
    raise exception 'Workspace not found for %', customer_email;
  end if;

  select ps.id
  into target_submission_id
  from public.payment_submissions ps
  where ps.org_id = target_org_id
    and ps.status = 'pending'
  order by ps.created_at desc
  limit 1;

  if target_submission_id is not null then
    update public.payment_submissions
    set
      status = 'approved',
      reviewed_at = now(),
      subscription_ends_at = coalesce(
        subscription_ends_at,
        (payment_date + interval '30 days')::date
      )
    where id = target_submission_id;
  else
    raise notice 'No pending payment_submissions row — only updating organizations.plan';
  end if;

  update public.organizations
  set
    plan = paid_plan,
    trial_ends_at = null,
    member_limit = case paid_plan
      when 'growth' then 3
      when 'scale' then 5
      else 1
    end
  where id = target_org_id;

  raise notice 'Activated % on plan % (org %)', customer_email, paid_plan, target_org_id;
end;
$$;

-- Verify:
-- select o.name, o.plan, o.trial_ends_at, o.member_limit, ps.status, ps.reviewed_at
-- from public.organizations o
-- left join lateral (
--   select status, reviewed_at
--   from public.payment_submissions
--   where org_id = o.id
--   order by created_at desc
--   limit 1
-- ) ps on true
-- join public.org_members om on om.org_id = o.id
-- join auth.users u on u.id = om.user_id
-- where lower(u.email) = lower('email-pelanggan@example.com');

notify pgrst, 'reload schema';
