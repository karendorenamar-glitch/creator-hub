-- Run in the Supabase SQL Editor.
-- Prerequisites (run once if not done yet):
--   1. supabase/org-plan.sql
--   2. supabase/payment-submissions.sql
--   3. supabase/plan-checkout-views.sql
--
-- our_database          → one row per workspace (summary + latest checkout)
-- our_database_checkouts → one row per submitted checkout form
--
-- Drop first: CREATE OR REPLACE cannot reorder/rename view columns in Postgres.

drop view if exists public.our_database_checkouts;
drop view if exists public.our_database;

create view public.our_database as
select
  o.id as org_id,
  o.name as workspace_name,
  o.slug as workspace_slug,
  o.plan as active_plan,
  o.trial_ends_at,
  o.created_at as workspace_created_at,
  owner.email as owner_email,
  owner.signed_up_at as owner_signed_up_at,
  coalesce(stats.member_count, 0) as member_count,
  coalesce(stats.creator_count, 0) as creator_count,
  coalesce(stats.campaign_count, 0) as campaign_count,
  coalesce(stats.video_count, 0) as video_count,
  coalesce(stats.payout_count, 0) as payout_count,
  checkout_views.plans_viewed as checkout_plans_viewed,
  checkout_views.latest_view_plan as latest_checkout_view_plan,
  checkout_views.latest_viewed_at as latest_checkout_viewed_at,
  latest_checkout.id as latest_checkout_submission_id,
  latest_checkout.plan as latest_checkout_plan,
  latest_checkout.status as latest_checkout_status,
  latest_checkout.amount_idr as latest_checkout_amount_idr,
  latest_checkout.payment_date as latest_checkout_payment_date,
  latest_checkout.sender_name as latest_checkout_sender_name,
  latest_checkout.notes as latest_checkout_notes,
  latest_checkout.proof_url as latest_checkout_proof_url,
  latest_checkout.created_at as latest_checkout_submitted_at,
  latest_checkout.reviewed_at as latest_checkout_reviewed_at
from public.organizations o
left join lateral (
  select
    u.email,
    u.created_at as signed_up_at
  from public.org_members om
  join auth.users u on u.id = om.user_id
  where om.org_id = o.id
    and om.role = 'owner'
  order by om.created_at asc
  limit 1
) owner on true
left join lateral (
  select
    (select count(*) from public.org_members om where om.org_id = o.id) as member_count,
    (select count(*) from public.creators c where c.org_id = o.id) as creator_count,
    (select count(*) from public.campaigns ca where ca.org_id = o.id) as campaign_count,
    (select count(*) from public.videos v where v.org_id = o.id) as video_count,
    (select count(*) from public.payouts p where p.org_id = o.id) as payout_count
) stats on true
left join lateral (
  select
    string_agg(distinct cv.plan, ', ' order by cv.plan) as plans_viewed,
    (
      select cv2.plan
      from public.plan_checkout_views cv2
      where cv2.org_id = o.id
      order by cv2.created_at desc
      limit 1
    ) as latest_view_plan,
    max(cv.created_at) as latest_viewed_at
  from public.plan_checkout_views cv
  where cv.org_id = o.id
) checkout_views on true
left join lateral (
  select
    ps.id,
    ps.plan,
    ps.status,
    ps.amount_idr,
    ps.payment_date,
    ps.sender_name,
    ps.notes,
    ps.proof_url,
    ps.created_at,
    ps.reviewed_at
  from public.payment_submissions ps
  where ps.org_id = o.id
  order by ps.created_at desc
  limit 1
) latest_checkout on true
order by o.created_at desc;

create view public.our_database_checkouts as
select
  ps.id as submission_id,
  ps.org_id,
  o.name as workspace_name,
  o.slug as workspace_slug,
  owner.email as owner_email,
  o.plan as active_plan,
  ps.plan as selected_plan,
  ps.amount_idr,
  ps.payment_date,
  ps.sender_name,
  ps.notes,
  ps.proof_url,
  ps.status as submission_status,
  ps.created_at as submitted_at,
  ps.reviewed_at
from public.payment_submissions ps
join public.organizations o on o.id = ps.org_id
left join lateral (
  select u.email
  from public.org_members om
  join auth.users u on u.id = om.user_id
  where om.org_id = o.id
    and om.role = 'owner'
  order by om.created_at asc
  limit 1
) owner on true
order by ps.created_at desc;

comment on view public.our_database is
  'Admin export: one row per workspace with usage, plans viewed, and latest checkout form.';

comment on view public.our_database_checkouts is
  'Admin export: one row per checkout form submission with all fields.';

revoke all on public.our_database from anon, authenticated;
revoke all on public.our_database_checkouts from anon, authenticated;

notify pgrst, 'reload schema';
