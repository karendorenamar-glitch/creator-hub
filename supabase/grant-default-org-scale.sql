-- Run once in Supabase → SQL Editor if your main workspace should have full access.
-- Ensures the legacy "Kefoo" workspace uses the Scale plan (all features, no trial limits).

update public.organizations
set
  plan = 'scale',
  trial_ends_at = null
where id = '11111111-1111-1111-1111-111111111111';

-- Optional: ensure your main account is an owner of the default workspace.
-- insert into public.org_members (org_id, user_id, role)
-- select
--   '11111111-1111-1111-1111-111111111111',
--   id,
--   'owner'
-- from auth.users
-- where email = 'karendorenamar@gmail.com'
-- on conflict (org_id, user_id) do nothing;

notify pgrst, 'reload schema';
