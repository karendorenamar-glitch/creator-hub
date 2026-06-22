-- Run in the Supabase SQL Editor if inspiration_url is not already present.

alter table public.content_planner_agency
  add column if not exists inspiration_url text;

notify pgrst, 'reload schema';
