-- Add optional creator names to content planner rows.

alter table public.content_planner_agency
  add column if not exists creator_names text[] not null default '{}';

notify pgrst, 'reload schema';
