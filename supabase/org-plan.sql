-- Run this in Supabase → SQL Editor (required once for free trial plans).
-- After running, signup will store plan + trial end date on each workspace.

alter table public.organizations
  add column if not exists plan text not null default 'free_trial'
    check (plan in ('free_trial', 'starter', 'growth', 'scale'));

alter table public.organizations
  add column if not exists trial_ends_at timestamptz;

-- Existing default workspace: no trial limits.
update public.organizations
set
  plan = 'scale',
  trial_ends_at = null
where id = '11111111-1111-1111-1111-111111111111';

-- Other existing workspaces: 30-day trial window from migration time.
update public.organizations
set trial_ends_at = now() + interval '30 days'
where plan = 'free_trial'
  and trial_ends_at is null
  and id <> '11111111-1111-1111-1111-111111111111';

-- Refresh Supabase API schema cache (fixes "Could not find the 'plan' column" errors).
notify pgrst, 'reload schema';
