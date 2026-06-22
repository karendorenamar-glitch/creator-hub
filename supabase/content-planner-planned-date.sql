-- Add optional scheduling date to content planner rows.

alter table public.content_planner_agency
  add column if not exists planned_date date;

notify pgrst, 'reload schema';
