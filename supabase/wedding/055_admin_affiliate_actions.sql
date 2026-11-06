-- Kefoo — 055: admin suspend / delete for affiliates
-- Two security-definer RPCs. Financial history is never deleted by the app.

begin;

create or replace function public.admin_set_affiliate_status(
  p_affiliate uuid, p_status text, p_reason text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid status.';
  end if;

  update public.affiliates
  set status = p_status,
      suspended_reason = case when p_status = 'suspended'
        then nullif(left(coalesce(trim(p_reason), ''), 300), '')
        else null end
  where id = p_affiliate;

  if not found then
    raise exception 'Affiliate not found.';
  end if;
end;
$$;

create or replace function public.admin_delete_affiliate(p_affiliate uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  if exists (select 1 from public.affiliate_clicks where affiliate_id = p_affiliate)
     or exists (select 1 from public.affiliate_referrals where affiliate_id = p_affiliate)
     or exists (select 1 from public.affiliate_commissions where affiliate_id = p_affiliate)
     or exists (select 1 from public.affiliate_payouts where affiliate_id = p_affiliate) then
    raise exception 'This affiliate has history. Suspend it instead of deleting.';
  end if;

  delete from public.affiliates where id = p_affiliate;
  if not found then
    raise exception 'Affiliate not found.';
  end if;
end;
$$;

revoke all on function public.admin_set_affiliate_status(uuid, text, text) from public, anon;
revoke all on function public.admin_delete_affiliate(uuid) from public, anon;
grant execute on function public.admin_set_affiliate_status(uuid, text, text) to authenticated;
grant execute on function public.admin_delete_affiliate(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
