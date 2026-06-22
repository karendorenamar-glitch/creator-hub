-- Run in the Supabase SQL Editor for Content Planner.

create table if not exists public.content_planner_agency (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_pillar text not null default '',
  content_idea text not null default '',
  hook text not null default '',
  creator_names text[] not null default '{}',
  campaign_id uuid references public.campaigns(id) on delete set null,
  planned_date date,
  inspiration_url text,
  platform text not null default '',
  status text not null default 'Draft',
  created_at timestamptz not null default now()
);

alter table public.content_planner_agency enable row level security;

create policy "Users can read own content planner rows"
  on public.content_planner_agency for select
  using (auth.uid() = user_id);

create policy "Users can insert own content planner rows"
  on public.content_planner_agency for insert
  with check (auth.uid() = user_id);

create policy "Users can update own content planner rows"
  on public.content_planner_agency for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own content planner rows"
  on public.content_planner_agency for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
