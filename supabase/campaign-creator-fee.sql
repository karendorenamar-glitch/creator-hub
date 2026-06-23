-- Campaign-specific creator fees (separate from creators.fee defaults)
alter table public.campaign_creators
  add column if not exists fee numeric;
