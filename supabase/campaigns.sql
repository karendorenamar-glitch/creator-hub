-- Run this if you already have creators/videos tables but need campaigns.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text not null,
  start_date date not null,
  end_date date not null,
  budget numeric(12, 2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_creators (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  primary key (campaign_id, creator_id)
);

create table if not exists public.campaign_videos (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  primary key (campaign_id, video_id)
);

alter table public.campaigns enable row level security;
alter table public.campaign_creators enable row level security;
alter table public.campaign_videos enable row level security;

create policy "Allow public read access on campaigns"
  on public.campaigns for select using (true);
create policy "Allow public insert on campaigns"
  on public.campaigns for insert with check (true);
create policy "Allow public update on campaigns"
  on public.campaigns for update using (true) with check (true);
create policy "Allow public delete on campaigns"
  on public.campaigns for delete using (true);

create policy "Allow public read access on campaign_creators"
  on public.campaign_creators for select using (true);
create policy "Allow public insert on campaign_creators"
  on public.campaign_creators for insert with check (true);
create policy "Allow public update on campaign_creators"
  on public.campaign_creators for update using (true) with check (true);
create policy "Allow public delete on campaign_creators"
  on public.campaign_creators for delete using (true);

create policy "Allow public read access on campaign_videos"
  on public.campaign_videos for select using (true);
create policy "Allow public insert on campaign_videos"
  on public.campaign_videos for insert with check (true);
create policy "Allow public update on campaign_videos"
  on public.campaign_videos for update using (true) with check (true);
create policy "Allow public delete on campaign_videos"
  on public.campaign_videos for delete using (true);
