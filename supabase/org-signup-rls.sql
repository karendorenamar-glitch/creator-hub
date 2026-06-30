-- Run in Supabase → SQL Editor if signup fails with RLS on organizations.
-- Creates a secure workspace bootstrap function and ensures insert policies exist.
--
-- If you see "cannot change return type of existing function", run
-- supabase/trial-and-signup-migration.sql instead (it drops the old function first).

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

revoke all on function public.create_organization_for_user(text, text, text, timestamptz)
  from public;
grant execute on function public.create_organization_for_user(text, text, text, timestamptz)
  to authenticated;

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Users can insert own org membership" on public.org_members;
create policy "Users can insert own org membership"
  on public.org_members for insert
  to authenticated
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
