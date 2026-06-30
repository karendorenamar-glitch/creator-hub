-- Track the last successful Discover keyword scan per workspace (Scale weekly limit).
-- Run once in Supabase → SQL Editor.

alter table public.organizations
  add column if not exists discover_last_scan_at timestamptz;

create index if not exists organizations_discover_last_scan_at_idx
  on public.organizations (discover_last_scan_at)
  where discover_last_scan_at is not null;

notify pgrst, 'reload schema';
