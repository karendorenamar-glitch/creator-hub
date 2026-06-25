-- Run in the Supabase SQL Editor to add multi-tenant organizations.
-- Backfills existing rows into a default workspace for Kefoo.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  plan text not null default 'free_trial'
    check (plan in ('free_trial', 'starter', 'growth', 'scale')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists organizations_slug_unique
  on public.organizations (lower(trim(slug)))
  where slug is not null and trim(slug) <> '';

create table if not exists public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_members_user_id_idx
  on public.org_members (user_id);

-- Default workspace for existing data (fixed id for backfill scripts).
insert into public.organizations (id, name, slug)
values (
  '11111111-1111-1111-1111-111111111111',
  'Kefoo',
  'kefoo'
)
on conflict (id) do nothing;

alter table public.creators
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

alter table public.campaigns
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

alter table public.videos
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

alter table public.payouts
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

alter table public.content_planner_agency
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

update public.creators
set org_id = '11111111-1111-1111-1111-111111111111'
where org_id is null;

update public.campaigns
set org_id = '11111111-1111-1111-1111-111111111111'
where org_id is null;

update public.videos v
set org_id = c.org_id
from public.creators c
where v.creator_id = c.id
  and v.org_id is null;

update public.videos
set org_id = '11111111-1111-1111-1111-111111111111'
where org_id is null;

update public.payouts p
set org_id = c.org_id
from public.creators c
where p.creator_id = c.id
  and p.org_id is null;

update public.payouts
set org_id = '11111111-1111-1111-1111-111111111111'
where org_id is null;

update public.content_planner_agency
set org_id = '11111111-1111-1111-1111-111111111111'
where org_id is null;

alter table public.creators alter column org_id set not null;
alter table public.campaigns alter column org_id set not null;
alter table public.videos alter column org_id set not null;
alter table public.payouts alter column org_id set not null;
alter table public.content_planner_agency alter column org_id set not null;

create index if not exists creators_org_id_idx on public.creators (org_id);
create index if not exists campaigns_org_id_idx on public.campaigns (org_id);
create index if not exists videos_org_id_idx on public.videos (org_id);
create index if not exists payouts_org_id_idx on public.payouts (org_id);
create index if not exists content_planner_agency_org_id_idx
  on public.content_planner_agency (org_id);

-- Scope unique indexes per organization.
drop index if exists public.creators_name_contact_unique;
create unique index if not exists creators_org_name_contact_unique
  on public.creators (
    org_id,
    lower(trim(name)),
    lower(trim(coalesce(contact, '')))
  );

drop index if exists public.creators_tiktok_username_unique;
create unique index if not exists creators_org_tiktok_username_unique
  on public.creators (org_id, lower(tiktok_username))
  where tiktok_username is not null and trim(tiktok_username) <> '';

-- Add existing auth users to the default org as owners.
insert into public.org_members (org_id, user_id, role)
select
  '11111111-1111-1111-1111-111111111111',
  id,
  'owner'
from auth.users
on conflict (org_id, user_id) do nothing;

create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members
    where org_id = check_org_id
      and user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
  on public.organizations for select
  using (public.is_org_member(id));

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Org owners can update organizations" on public.organizations;
create policy "Org owners can update organizations"
  on public.organizations for update
  using (
    exists (
      select 1 from public.org_members
      where org_id = id
        and user_id = auth.uid()
        and role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.org_members
      where org_id = id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

drop policy if exists "Members can read org membership" on public.org_members;
create policy "Members can read org membership"
  on public.org_members for select
  using (public.is_org_member(org_id));

drop policy if exists "Users can insert own org membership" on public.org_members;
create policy "Users can insert own org membership"
  on public.org_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Replace open policies on domain tables.
drop policy if exists "Allow public read access on creators" on public.creators;
drop policy if exists "Allow public insert on creators" on public.creators;
drop policy if exists "Allow public update on creators" on public.creators;
drop policy if exists "Allow public delete on creators" on public.creators;

create policy "Org members can read creators"
  on public.creators for select
  using (public.is_org_member(org_id));

create policy "Org members can insert creators"
  on public.creators for insert
  with check (public.is_org_member(org_id));

create policy "Org members can update creators"
  on public.creators for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Org members can delete creators"
  on public.creators for delete
  using (public.is_org_member(org_id));

drop policy if exists "Allow public read access on videos" on public.videos;
drop policy if exists "Allow public insert on videos" on public.videos;
drop policy if exists "Allow public update on videos" on public.videos;
drop policy if exists "Allow public delete on videos" on public.videos;

create policy "Org members can read videos"
  on public.videos for select
  using (public.is_org_member(org_id));

create policy "Org members can insert videos"
  on public.videos for insert
  with check (public.is_org_member(org_id));

create policy "Org members can update videos"
  on public.videos for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Org members can delete videos"
  on public.videos for delete
  using (public.is_org_member(org_id));

drop policy if exists "Allow public read access on campaigns" on public.campaigns;
drop policy if exists "Allow public insert on campaigns" on public.campaigns;
drop policy if exists "Allow public update on campaigns" on public.campaigns;
drop policy if exists "Allow public delete on campaigns" on public.campaigns;

create policy "Org members can read campaigns"
  on public.campaigns for select
  using (public.is_org_member(org_id));

create policy "Org members can insert campaigns"
  on public.campaigns for insert
  with check (public.is_org_member(org_id));

create policy "Org members can update campaigns"
  on public.campaigns for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Org members can delete campaigns"
  on public.campaigns for delete
  using (public.is_org_member(org_id));

drop policy if exists "Allow public read access on campaign_creators" on public.campaign_creators;
drop policy if exists "Allow public insert on campaign_creators" on public.campaign_creators;
drop policy if exists "Allow public update on campaign_creators" on public.campaign_creators;
drop policy if exists "Allow public delete on campaign_creators" on public.campaign_creators;

create policy "Org members can read campaign_creators"
  on public.campaign_creators for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can insert campaign_creators"
  on public.campaign_creators for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can update campaign_creators"
  on public.campaign_creators for update
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can delete campaign_creators"
  on public.campaign_creators for delete
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

drop policy if exists "Allow public read access on campaign_videos" on public.campaign_videos;
drop policy if exists "Allow public insert on campaign_videos" on public.campaign_videos;
drop policy if exists "Allow public update on campaign_videos" on public.campaign_videos;
drop policy if exists "Allow public delete on campaign_videos" on public.campaign_videos;

create policy "Org members can read campaign_videos"
  on public.campaign_videos for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can insert campaign_videos"
  on public.campaign_videos for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can update campaign_videos"
  on public.campaign_videos for update
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

create policy "Org members can delete campaign_videos"
  on public.campaign_videos for delete
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.is_org_member(c.org_id)
    )
  );

drop policy if exists "Allow public read access on payouts" on public.payouts;
drop policy if exists "Allow public insert on payouts" on public.payouts;
drop policy if exists "Allow public update on payouts" on public.payouts;
drop policy if exists "Allow public delete on payouts" on public.payouts;

create policy "Org members can read payouts"
  on public.payouts for select
  using (public.is_org_member(org_id));

create policy "Org members can insert payouts"
  on public.payouts for insert
  with check (public.is_org_member(org_id));

create policy "Org members can update payouts"
  on public.payouts for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Org members can delete payouts"
  on public.payouts for delete
  using (public.is_org_member(org_id));

drop policy if exists "Users can read own content planner rows" on public.content_planner_agency;
drop policy if exists "Users can insert own content planner rows" on public.content_planner_agency;
drop policy if exists "Users can update own content planner rows" on public.content_planner_agency;
drop policy if exists "Users can delete own content planner rows" on public.content_planner_agency;

create policy "Org members can read content planner rows"
  on public.content_planner_agency for select
  using (public.is_org_member(org_id));

create policy "Org members can insert content planner rows"
  on public.content_planner_agency for insert
  with check (public.is_org_member(org_id) and auth.uid() = user_id);

create policy "Org members can update content planner rows"
  on public.content_planner_agency for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Org members can delete content planner rows"
  on public.content_planner_agency for delete
  using (public.is_org_member(org_id));

-- Signup: create workspace + leader membership atomically (bypasses RLS read-after-insert issue).
drop function if exists public.create_organization_for_user(text, text, text, timestamptz);

create or replace function public.create_organization_for_user(
  org_name text,
  org_slug text,
  org_plan text default 'free_trial',
  org_trial_ends_at timestamptz default (now() + interval '30 days')
)
returns table (
  id uuid,
  name text,
  slug text,
  plan text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  new_org public.organizations%rowtype;
  resolved_plan text := coalesce(nullif(trim(org_plan), ''), 'free_trial');
  resolved_limit integer;
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  if trim(org_name) = '' then
    raise exception 'Organization name is required';
  end if;

  resolved_limit := case resolved_plan
    when 'growth' then 3
    when 'scale' then 5
    else 1
  end;

  insert into public.organizations (name, slug, plan, trial_started_at, trial_ends_at, member_limit)
  values (
    trim(org_name),
    nullif(trim(org_slug), ''),
    resolved_plan,
    case when resolved_plan = 'free_trial' then now() else null end,
    case
      when resolved_plan = 'free_trial'
        then coalesce(org_trial_ends_at, now() + interval '30 days')
      else null
    end,
    resolved_limit
  )
  returning * into new_org;

  insert into public.org_members (org_id, user_id, role)
  values (new_org.id, caller, 'leader');

  return query
  select
    new_org.id,
    new_org.name::text,
    new_org.slug::text,
    new_org.plan::text,
    new_org.trial_started_at,
    new_org.trial_ends_at,
    new_org.created_at;
end;
$$;

revoke all on function public.create_organization_for_user(text, text, text, timestamptz)
  from public;
grant execute on function public.create_organization_for_user(text, text, text, timestamptz)
  to authenticated;

notify pgrst, 'reload schema';
