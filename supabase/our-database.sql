-- Run in the Supabase SQL Editor.
-- Creates a read-only export view named our_database (one row per workspace).
-- Use Table Editor → our_database → Export CSV for spreadsheets.

create or replace view public.our_database as
select
  o.id as org_id,
  o.name as workspace_name,
  o.slug as workspace_slug,
  o.created_at as workspace_created_at,
  owner.email as owner_email,
  owner.signed_up_at as owner_signed_up_at,
  coalesce(stats.member_count, 0) as member_count,
  coalesce(stats.creator_count, 0) as creator_count,
  coalesce(stats.campaign_count, 0) as campaign_count,
  coalesce(stats.video_count, 0) as video_count,
  coalesce(stats.payout_count, 0) as payout_count
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
order by o.created_at desc;

comment on view public.our_database is
  'Admin export view: workspaces, owners, and usage counts for spreadsheets.';

-- Keep this admin-only (export from Supabase dashboard, not from the public app).
revoke all on public.our_database from anon, authenticated;

notify pgrst, 'reload schema';
