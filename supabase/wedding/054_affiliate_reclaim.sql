-- Kefoo — 054: let an affiliate reclaim their old profile
-- Replaces register_affiliate so a deleted auth account can re-register without
-- losing the referral code. No table, policy or data change.

begin;

create or replace function public.register_affiliate(
  p_full_name text,
  p_email text
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(p_email));
  v_existing public.affiliates%rowtype;
  v_base text;
  v_code text;
  v_try int := 0;
begin
  if v_user is null then
    raise exception 'Not signed in.';
  end if;

  -- Already linked to this account: nothing to do.
  select * into v_existing from public.affiliates where user_id = v_user;
  if found then
    raise exception 'Already an affiliate.';
  end if;

  -- Orphan row from a deleted auth account: claim it and keep the old code.
  select * into v_existing
  from public.affiliates
  where user_id is null and lower(email) = v_email
  order by created_at asc
  limit 1
  for update;

  if found then
    update public.affiliates
    set user_id = v_user,
        full_name = left(coalesce(nullif(trim(p_full_name), ''), full_name), 120),
        status = case when status = 'suspended' then status else 'active' end
    where id = v_existing.id;

    return v_existing.referral_code;
  end if;

  v_base := upper(substr(replace(v_user::text, '-', ''), 1, 6));
  v_code := v_base;

  while exists (select 1 from public.affiliates a where a.referral_code = v_code) loop
    v_try := v_try + 1;
    v_code := v_base || v_try::text;
    if v_try > 50 then
      raise exception 'Could not allocate a referral code.';
    end if;
  end loop;

  insert into public.affiliates (user_id, email, full_name, referral_code, status)
  values (v_user, v_email, left(trim(p_full_name), 120), v_code, 'active');

  return v_code;
end;
$$;

revoke all on function public.register_affiliate(text, text) from public, anon;
grant execute on function public.register_affiliate(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
