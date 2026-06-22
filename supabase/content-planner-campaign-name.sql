-- Add campaign name to content planner rows.

alter table public.content_planner_agency
  add column if not exists campaign_name text;

notify pgrst, 'reload schema';
