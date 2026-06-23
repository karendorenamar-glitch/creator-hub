-- Personal campaigns track per-creator workflow status on campaign details.

alter table public.campaigns
  add column if not exists campaign_type text not null default 'bulk'
  check (campaign_type in ('bulk', 'personal'));

alter table public.campaign_creators
  add column if not exists workflow_status text
  check (
    workflow_status is null
    or workflow_status in ('brief_sent', 'waiting_content', 'revision', 'posted')
  );

notify pgrst, 'reload schema';
