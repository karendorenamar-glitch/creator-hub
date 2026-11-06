-- Kefoo — 056: let admins delete test affiliates without touching money
-- Clicks and referrals are attribution data and are removed with the profile.
-- Commissions and payouts are financial records and always block deletion.

begin;

create or replace function public.admin_delete_affiliate(
  p_affiliate uuid,
  p_delete_login boolean default false
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select user_id into v_user from public.affiliates where id = p_affiliate;
  if not found then
    raise exception 'Affiliate not found.';
  end if;

  if exists (select 1 from public.affiliate_commissions where affiliate_id = p_affiliate)
     or exists (select 1 from public.affiliate_payouts where affiliate_id = p_affiliate) then
    raise exception 'This affiliate has commission or payout history. Suspend it instead.';
  end if;

  delete from public.affiliate_clicks where affiliate_id = p_affiliate;
  delete from public.affiliate_referrals where affiliate_id = p_affiliate;
  delete from public.affiliate_ledger where affiliate_id = p_affiliate;
  delete from public.affiliates where id = p_affiliate;

  if p_delete_login and v_user is not null then
    delete from auth.users where id = v_user;
  end if;
end;
$$;

revoke all on function public.admin_delete_affiliate(uuid, boolean) from public, anon;
grant execute on function public.admin_delete_affiliate(uuid, boolean) to authenticated;

-- keep the old single-argument signature working
create or replace function public.admin_delete_affiliate(p_affiliate uuid)
returns void
language sql security definer set search_path = ''
as $$
  select public.admin_delete_affiliate(p_affiliate, false);
$$;

revoke all on function public.admin_delete_affiliate(uuid) from public, anon;
grant execute on function public.admin_delete_affiliate(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
