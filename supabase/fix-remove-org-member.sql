-- Fix: leader Remove in Settings deletes org_members, pending invites,
-- and auth.users when the person no longer belongs to any workspace.
-- Run once in Supabase → SQL Editor (safe to re-run).

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

revoke all on function public.remove_org_member(uuid, uuid) from public;
grant execute on function public.remove_org_member(uuid, uuid) to authenticated;

drop policy if exists "Leaders can delete org members" on public.org_members;
create policy "Leaders can delete org members"
  on public.org_members for delete
  using (
    public.is_org_leader(org_id)
    and user_id <> auth.uid()
  );

notify pgrst, 'reload schema';
