-- Kefoo — 052: affiliate self-registration
-- Additive. Lets a signed-in user create their own affiliate profile and code.
-- No customer table, payment or wedding data is touched.

begin;

create or replace function public.register_affiliate(
  p_full_name text,
  p_email text
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_base text;
  v_code text;
  v_try int := 0;
begin
  if v_user is null then
    raise exception 'Not signed in.';
  end if;

  if exists (select 1 from public.affiliates a where a.user_id = v_user) then
    raise exception 'Already an affiliate.';
  end if;

  -- 6 chars from the account id: stable, uppercase, no ambiguous characters
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
  values (
    v_user,
    lower(trim(p_email)),
    left(trim(p_full_name), 120),
    v_code,
    'active'
  );

  return v_code;
end;
$$;

revoke all on function public.register_affiliate(text, text) from public, anon;
grant execute on function public.register_affiliate(text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
