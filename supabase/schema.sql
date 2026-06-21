-- Run this in the Supabase SQL Editor to set up Creator Hub tables.

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  notes text,
  platform text not null default 'YouTube',
  followers integer not null default 0,
  fee numeric(15, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  title text not null,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.creators enable row level security;
alter table public.videos enable row level security;

create policy "Allow public read access on creators"
  on public.creators for select
  using (true);

create policy "Allow public insert on creators"
  on public.creators for insert
  with check (true);

create policy "Allow public update on creators"
  on public.creators for update
  using (true)
  with check (true);

create policy "Allow public delete on creators"
  on public.creators for delete
  using (true);

create policy "Allow public read access on videos"
  on public.videos for select
  using (true);

create policy "Allow public insert on videos"
  on public.videos for insert
  with check (true);

create policy "Allow public update on videos"
  on public.videos for update
  using (true)
  with check (true);

create policy "Allow public delete on videos"
  on public.videos for delete
  using (true);

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

-- Sample seed data (optional)
insert into public.creators (name, contact, platform, followers) values
  ('Alex Rivera', 'alex@example.com', 'YouTube', 1250000),
  ('Jordan Lee', 'jordan@example.com', 'TikTok', 890000),
  ('Sam Chen', 'sam@example.com', 'Instagram', 450000)
on conflict do nothing;

insert into public.videos (creator_id, title, views, likes, comments, shares)
select c.id, v.title, v.views, v.likes, v.comments, v.shares
from public.creators c
cross join lateral (
  values
    ('How I grew to 1M subs', 520000, 42000, 1800, 950),
    ('Day in my life vlog', 310000, 28000, 920, 610)
) as v(title, views, likes, comments, shares)
where c.name = 'Alex Rivera'
on conflict do nothing;

insert into public.videos (creator_id, title, views, likes, comments, shares)
select c.id, v.title, v.views, v.likes, v.comments, v.shares
from public.creators c
cross join lateral (
  values
    ('60-second editing hack', 1200000, 98000, 4200, 3100),
    ('Trend breakdown #42', 780000, 61000, 2800, 1900)
) as v(title, views, likes, comments, shares)
where c.name = 'Jordan Lee'
on conflict do nothing;

insert into public.videos (creator_id, title, views, likes, comments, shares)
select c.id, v.title, v.views, v.likes, v.comments, v.shares
from public.creators c
cross join lateral (
  values
    ('Reel ideas that convert', 95000, 7200, 410, 280)
) as v(title, views, likes, comments, shares)
where c.name = 'Sam Chen'
on conflict do nothing;
