-- Permanent Scale plan for karendorenamar@gmail.com (all owned workspaces).
-- Run once in Supabase → SQL Editor after org-plan.sql.

update public.organizations o
set
  plan = 'scale',
  trial_ends_at = null
from public.org_members om
join auth.users u on u.id = om.user_id
where om.org_id = o.id
  and om.role in ('owner', 'leader')
  and lower(trim(u.email)) = lower('karendorenamar@gmail.com');

notify pgrst, 'reload schema';
