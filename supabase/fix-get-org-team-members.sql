-- Fix: "structure of query does not match function result type" on Team settings.
-- Run once in Supabase → SQL Editor (safe to re-run).

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

notify pgrst, 'reload schema';
