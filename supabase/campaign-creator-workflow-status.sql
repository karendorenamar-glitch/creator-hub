-- Per-creator workflow status on campaign details (Brief Sent → Posted).
-- Run once in Supabase SQL Editor if status updates or campaign edits fail.

alter table public.campaign_creators
  add column if not exists workflow_status text
  check (
    workflow_status is null
    or workflow_status in ('brief_sent', 'waiting_content', 'revision', 'posted')
  );

notify pgrst, 'reload schema';
