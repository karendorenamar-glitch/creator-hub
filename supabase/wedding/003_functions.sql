-- Kefoo Wedding Planner - 003 functions: safe workflows that need elevated rights.
-- Run THIRD (after 001 and 002). Safe to re-run. Non-destructive.
--
-- These are SECURITY DEFINER because ordinary RLS cannot express them
-- (e.g. a brand-new user has no membership yet). Each one checks auth.uid()
-- itself and pins search_path. They are callable only by signed-in users.

-- Create a wedding, the owner membership, and an 'inactive' subscription atomically.
create or replace function public.create_wedding(
  p_partner_one_name text,
  p_partner_two_name text default null,
  p_wedding_date date default null,
  p_location text default null,
  p_estimated_guest_count integer default null,
  p_total_budget numeric default 0
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_wedding uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  -- Serialize concurrent create_wedding() calls from the SAME user for the
  -- duration of this transaction (double-submit / double-click). Keyed by user
  -- id, so different users never block one another. Released automatically at
  -- COMMIT or ROLLBACK. The partial unique index
  -- wedding_members_one_owned_wedding_idx is the hard backstop.
  perform pg_advisory_xact_lock(hashtext('create_wedding'), hashtext(v_user::text));

  if exists (select 1 from public.wedding_members where user_id = v_user and role = 'owner') then
    raise exception 'You already own a wedding.';
  end if;

  insert into public.weddings (
    created_by, partner_one_name, partner_two_name, wedding_date,
    location, estimated_guest_count, total_budget
  ) values (
    v_user, p_partner_one_name, p_partner_two_name, p_wedding_date,
    p_location, p_estimated_guest_count, coalesce(p_total_budget, 0)
  ) returning id into v_wedding;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (v_wedding, v_user, 'owner');

  -- No payment has happened: starts inactive. Never 'active' here.
  insert into public.subscriptions (wedding_id) values (v_wedding);

  return v_wedding;
end;
$$;

-- Accept an invite token. The signed-in user's email must match the invite.
create or replace function public.accept_wedding_invite(p_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_invite public.wedding_invites%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  select lower(email) into v_email from auth.users where id = v_user;

  select * into v_invite from public.wedding_invites
  where token = p_token and accepted_at is null and expires_at > now()
  for update;

  if not found then
    raise exception 'Invite is invalid or expired.';
  end if;
  if v_email is null or lower(v_invite.email) <> v_email then
    raise exception 'This invite was sent to a different email address.';
  end if;

  -- Already a member? Return early, otherwise the max-members trigger fires
  -- before ON CONFLICT is evaluated and would raise an error.
  if exists (
    select 1 from public.wedding_members
    where wedding_id = v_invite.wedding_id and user_id = v_user
  ) then
    update public.wedding_invites set accepted_at = now() where id = v_invite.id;
    return v_invite.wedding_id;
  end if;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (v_invite.wedding_id, v_user, 'partner');

  update public.wedding_invites set accepted_at = now() where id = v_invite.id;
  return v_invite.wedding_id;
end;
$$;

revoke all on function public.create_wedding(text, text, date, text, integer, numeric) from public, anon;
revoke all on function public.accept_wedding_invite(text) from public, anon;
grant execute on function public.create_wedding(text, text, date, text, integer, numeric) to authenticated;
grant execute on function public.accept_wedding_invite(text) to authenticated;

notify pgrst, 'reload schema';
