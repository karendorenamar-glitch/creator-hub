-- Team members, invites, and role-based permissions.
-- Run in the Supabase SQL Editor after organizations.sql and org-plan.sql.

-- ---------------------------------------------------------------------------
-- Roles: leader (workspace admin) | team (member)
-- ---------------------------------------------------------------------------

alter table public.org_members
  drop constraint if exists org_members_role_check;

update public.org_members
set role = 'leader'
where role = 'owner';

update public.org_members
set role = 'team'
where role = 'member';

alter table public.org_members
  alter column role set default 'leader';

alter table public.org_members
  add constraint org_members_role_check
  check (role in ('leader', 'team'));

-- ---------------------------------------------------------------------------
-- Seat limit per workspace (override plan default in Supabase when needed)
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column if not exists member_limit integer;

update public.organizations
set member_limit = case plan
  when 'growth' then 3
  when 'scale' then 3
  else 1
end
where member_limit is null;

-- ---------------------------------------------------------------------------
-- Track who created each campaign (for team edit permissions)
-- ---------------------------------------------------------------------------

alter table public.campaigns
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Pending invites
-- ---------------------------------------------------------------------------

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'team'
    check (role in ('leader', 'team')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists org_invites_org_id_idx
  on public.org_invites (org_id);

create index if not exists org_invites_email_idx
  on public.org_invites (lower(email));

create unique index if not exists org_invites_pending_email_org_idx
  on public.org_invites (org_id, lower(email))
  where accepted_at is null;

alter table public.org_invites enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_org_leader(check_org_id uuid)
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
      and role in ('leader', 'owner')
  );
$$;

create or replace function public.org_member_limit(p_org_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  org_record public.organizations%rowtype;
begin
  select * into org_record
  from public.organizations
  where id = p_org_id;

  if not found then
    return 1;
  end if;

  if org_record.member_limit is not null then
    return org_record.member_limit;
  end if;

  return case org_record.plan
    when 'growth' then 3
    when 'scale' then 3
    else 1
  end;
end;
$$;

create or replace function public.org_seat_usage(p_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select (
    (select count(*)::integer from public.org_members where org_id = p_org_id)
    +
    (
      select count(*)::integer
      from public.org_invites
      where org_id = p_org_id
        and accepted_at is null
        and expires_at > now()
    )
  );
$$;

create or replace function public.org_allows_team_invites(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and o.plan in ('growth', 'scale')
  );
$$;

-- ---------------------------------------------------------------------------
-- Invite / accept / remove (security definer)
-- ---------------------------------------------------------------------------

create or replace function public.invite_org_member(
  p_org_id uuid,
  p_email text,
  p_role text default 'team'
)
returns table (
  invite_id uuid,
  invite_token text,
  added_directly boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  normalized_email text := lower(trim(p_email));
  existing_user_id uuid;
  seat_limit integer;
  seat_usage integer;
  new_invite public.org_invites%rowtype;
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_org_leader(p_org_id) then
    raise exception 'Only leaders can invite team members';
  end if;

  if not public.org_allows_team_invites(p_org_id) then
    raise exception 'Team invites are available on the Scale plan only';
  end if;

  if normalized_email = '' or normalized_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'Enter a valid email address';
  end if;

  if p_role not in ('leader', 'team') then
    raise exception 'Invalid role';
  end if;

  seat_limit := public.org_member_limit(p_org_id);
  seat_usage := public.org_seat_usage(p_org_id);

  if seat_usage >= seat_limit then
    raise exception 'Team seat limit reached (%).', seat_limit;
  end if;

  select u.id into existing_user_id
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if existing_user_id is not null then
    if exists (
      select 1 from public.org_members
      where org_id = p_org_id and user_id = existing_user_id
    ) then
      raise exception 'This user is already in your workspace';
    end if;

    insert into public.org_members (org_id, user_id, role)
    values (p_org_id, existing_user_id, p_role);

    update public.org_invites
    set accepted_at = now()
    where org_id = p_org_id
      and lower(email) = normalized_email
      and accepted_at is null;

    return query select null::uuid, null::text, true::boolean;
    return;
  end if;

  delete from public.org_invites
  where org_id = p_org_id
    and lower(email) = normalized_email
    and accepted_at is null;

  insert into public.org_invites (org_id, email, role, invited_by)
  values (p_org_id, normalized_email, p_role, caller)
  returning * into new_invite;

  return query
  select
    new_invite.id,
    new_invite.token::text,
    false::boolean;
end;
$$;

create or replace function public.accept_org_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  invite_record public.org_invites%rowtype;
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  select lower(email) into caller_email
  from auth.users
  where id = caller;

  select * into invite_record
  from public.org_invites
  where token = trim(p_token)
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'Invite is invalid or has expired';
  end if;

  if caller_email <> lower(invite_record.email) then
    raise exception 'This invite was sent to a different email address';
  end if;

  if exists (
    select 1 from public.org_members
    where org_id = invite_record.org_id and user_id = caller
  ) then
    update public.org_invites
    set accepted_at = now()
    where id = invite_record.id;

    return invite_record.org_id;
  end if;

  if public.org_seat_usage(invite_record.org_id) >= public.org_member_limit(invite_record.org_id) then
    raise exception 'This workspace has reached its team seat limit';
  end if;

  insert into public.org_members (org_id, user_id, role)
  values (invite_record.org_id, caller, invite_record.role);

  update public.org_invites
  set accepted_at = now()
  where id = invite_record.id;

  return invite_record.org_id;
end;
$$;

create or replace function public.remove_org_member(
  p_org_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  leader_count integer;
  removed_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_org_leader(p_org_id) then
    raise exception 'Only leaders can remove team members';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot remove yourself';
  end if;

  select count(*)::integer into leader_count
  from public.org_members
  where org_id = p_org_id and role in ('leader', 'owner');

  if leader_count = 1 and exists (
    select 1 from public.org_members
    where org_id = p_org_id
      and user_id = p_user_id
      and role in ('leader', 'owner')
  ) then
    raise exception 'You cannot remove the last leader';
  end if;

  select u.email into removed_email
  from auth.users u
  where u.id = p_user_id;

  delete from public.org_members
  where org_id = p_org_id and user_id = p_user_id;

  if not found then
    raise exception 'Team member not found in this workspace';
  end if;

  if removed_email is not null then
    delete from public.org_invites
    where org_id = p_org_id
      and lower(email) = lower(removed_email)
      and accepted_at is null;
  end if;

  -- Delete login account when they no longer belong to any workspace.
  if not exists (
    select 1 from public.org_members om where om.user_id = p_user_id
  ) then
    delete from auth.users where id = p_user_id;
  end if;
end;
$$;

create or replace function public.cancel_org_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.org_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into invite_record
  from public.org_invites
  where id = p_invite_id;

  if not found then
    raise exception 'Invite not found';
  end if;

  if not public.is_org_leader(invite_record.org_id) then
    raise exception 'Only leaders can cancel invites';
  end if;

  delete from public.org_invites
  where id = p_invite_id and accepted_at is null;
end;
$$;

revoke all on function public.invite_org_member(uuid, text, text) from public;
grant execute on function public.invite_org_member(uuid, text, text) to authenticated;

revoke all on function public.accept_org_invite(text) from public;
grant execute on function public.accept_org_invite(text) to authenticated;

revoke all on function public.remove_org_member(uuid, uuid) from public;
grant execute on function public.remove_org_member(uuid, uuid) to authenticated;

revoke all on function public.cancel_org_invite(uuid) from public;
grant execute on function public.cancel_org_invite(uuid) to authenticated;

create or replace function public.get_org_team_members(p_org_id uuid)
returns table (
  user_id uuid,
  role text,
  email text,
  full_name text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_org_member(p_org_id) then
    raise exception 'Not a member of this workspace';
  end if;

  return query
  select
    om.user_id,
    om.role::text,
    coalesce(u.email::text, '') as email,
    coalesce(u.raw_user_meta_data ->> 'full_name', '')::text as full_name,
    om.created_at as joined_at
  from public.org_members om
  join auth.users u on u.id = om.user_id
  where om.org_id = p_org_id
  order by om.created_at asc;
end;
$$;

revoke all on function public.get_org_team_members(uuid) from public;
grant execute on function public.get_org_team_members(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Update workspace bootstrap to use leader role + member_limit
-- ---------------------------------------------------------------------------

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
    when 'scale' then 3
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

-- ---------------------------------------------------------------------------
-- RLS updates
-- ---------------------------------------------------------------------------

drop policy if exists "Org owners can update organizations" on public.organizations;
drop policy if exists "Org leaders can update organizations" on public.organizations;
create policy "Org leaders can update organizations"
  on public.organizations for update
  using (public.is_org_leader(id))
  with check (public.is_org_leader(id));

drop policy if exists "Org members can update campaigns" on public.campaigns;
create policy "Org members can update campaigns"
  on public.campaigns for update
  using (
    public.is_org_member(org_id)
    and (
      public.is_org_leader(org_id)
      or created_by is null
      or created_by = auth.uid()
    )
  )
  with check (
    public.is_org_member(org_id)
    and (
      public.is_org_leader(org_id)
      or created_by is null
      or created_by = auth.uid()
    )
  );

drop policy if exists "Org members can delete campaigns" on public.campaigns;
create policy "Org members can delete campaigns"
  on public.campaigns for delete
  using (
    public.is_org_member(org_id)
    and (
      public.is_org_leader(org_id)
      or created_by is null
      or created_by = auth.uid()
    )
  );

drop policy if exists "Leaders can delete org members" on public.org_members;
create policy "Leaders can delete org members"
  on public.org_members for delete
  using (
    public.is_org_leader(org_id)
    and user_id <> auth.uid()
  );

drop policy if exists "Leaders can manage org invites" on public.org_invites;
drop policy if exists "Leaders can read org invites" on public.org_invites;
drop policy if exists "Leaders can insert org invites" on public.org_invites;
drop policy if exists "Leaders can delete org invites" on public.org_invites;
create policy "Leaders can read org invites"
  on public.org_invites for select
  using (public.is_org_leader(org_id));

create policy "Leaders can insert org invites"
  on public.org_invites for insert
  with check (public.is_org_leader(org_id));

create policy "Leaders can delete org invites"
  on public.org_invites for delete
  using (public.is_org_leader(org_id));

-- Align legacy Scale workspaces with the 3-user plan limit.
update public.organizations
set member_limit = 3
where plan in ('growth', 'scale')
  and member_limit = 5;

notify pgrst, 'reload schema';
