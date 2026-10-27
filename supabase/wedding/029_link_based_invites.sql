-- Kefoo Wedding Planner - 029: link-based partner invitations.
-- Additive/non-destructive. Existing invites remain valid.
--
-- Acceptance is authorized by the secret token, expiry and one-time use, not by
-- matching the invited email. The owner still controls one pending link and the
-- database still enforces at most one partner membership.

alter table public.wedding_invites
  alter column email drop not null;

alter table public.wedding_invites
  drop constraint if exists wedding_invites_email_check;

alter table public.wedding_invites
  add constraint wedding_invites_email_check
  check (email is null or position('@' in email) > 1);

-- Partner invitation links do not expire on a timer. They remain valid until
-- accepted once or revoked by the owner. This is separate from the partner's
-- login session, which continues normally after acceptance.
alter table public.wedding_invites
  alter column expires_at drop not null;
alter table public.wedding_invites
  alter column expires_at drop default;

create or replace function public.accept_wedding_invite_link(p_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.wedding_invites%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  select * into v_invite
  from public.wedding_invites
  where token = p_token and accepted_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'Invite is invalid or expired.';
  end if;

  if exists (
    select 1 from public.wedding_members
    where wedding_id = v_invite.wedding_id and user_id = v_user
      and role = 'owner'
  ) then
    raise exception 'You already own this wedding.';
  end if;

  if exists (
    select 1 from public.wedding_members
    where wedding_id = v_invite.wedding_id and user_id = v_user
  ) then
    update public.wedding_invites set accepted_at = now()
    where id = v_invite.id;
    return v_invite.wedding_id;
  end if;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (v_invite.wedding_id, v_user, 'partner');

  update public.wedding_invites set accepted_at = now()
  where id = v_invite.id;

  return v_invite.wedding_id;
end;
$$;

revoke all on function public.accept_wedding_invite_link(text)
  from public, anon;
grant execute on function public.accept_wedding_invite_link(text)
  to authenticated;

notify pgrst, 'reload schema';
