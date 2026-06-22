-- Link content planner items to campaigns via campaign_id.

alter table public.content_planner_agency
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

alter table public.content_planner_agency
  drop column if exists campaign_name;

create index if not exists content_planner_agency_campaign_id_idx
  on public.content_planner_agency (campaign_id);

notify pgrst, 'reload schema';
