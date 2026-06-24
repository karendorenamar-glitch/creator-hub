-- Track who added each creator and video (for leader team filters).
-- Run once in Supabase → SQL Editor after org-team.sql.

alter table public.creators
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.videos
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists creators_created_by_idx
  on public.creators (org_id, created_by);

create index if not exists videos_created_by_idx
  on public.videos (org_id, created_by);

notify pgrst, 'reload schema';
