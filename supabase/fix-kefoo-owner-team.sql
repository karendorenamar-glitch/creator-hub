-- One-time fix for karendorenamar@gmail.com (Kefoo owner workspace + team).
-- Run in Supabase → SQL Editor in this order:
--   1. supabase/org-team.sql          (team invites, roles, member_limit)
--   2. this file                      (ensure membership + Scale seats)

-- Link account to default Kefoo workspace if missing
insert into public.org_members (org_id, user_id, role)
select
  '11111111-1111-1111-1111-111111111111',
  u.id,
  'leader'
from auth.users u
where lower(trim(u.email)) = lower('karendorenamar@gmail.com')
on conflict (org_id, user_id) do update
set role = 'leader';

-- Permanent Scale + 5 seats on every workspace you lead
update public.organizations o
set
  plan = 'scale',
  trial_ends_at = null,
  member_limit = 5
from public.org_members om
join auth.users u on u.id = om.user_id
where om.org_id = o.id
  and om.role = 'leader'
  and lower(trim(u.email)) = lower('karendorenamar@gmail.com');

notify pgrst, 'reload schema';
