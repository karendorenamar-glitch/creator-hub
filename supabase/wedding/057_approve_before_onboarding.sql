-- Kefoo — 057: approve payments that were made before onboarding
-- Since migration 015 a customer pays before any wedding exists, so
-- payments.wedding_id is NULL. approve_payment() still required a wedding and
-- failed with 'Payment is not linked to a wedding of this customer.'

begin;

create or replace function public.approve_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_affiliate_id uuid;
  v_referral_id uuid;
  v_base_amount numeric;
  v_commission numeric;
  v_commission_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select * into v_payment from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found.';
  end if;
  if v_payment.status = 'approved' then
    return; -- idempotent
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Only payments pending review can be approved.';
  end if;

  -- Only a payment that is tied to a wedding must belong to that wedding.
  if v_payment.wedding_id is not null then
    if not exists (
      select 1 from public.wedding_members m
      where m.wedding_id = v_payment.wedding_id
        and m.user_id = v_payment.user_id
    ) then
      raise exception 'Payment is not linked to a wedding of this customer.';
    end if;
  end if;

  update public.payments
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(),
      rejection_reason = null
  where id = p_payment_id;

  if v_payment.wedding_id is not null then
    update public.weddings
    set lifetime_access_granted_at = coalesce(lifetime_access_granted_at, now()),
        lifetime_access_payment_id = p_payment_id
    where id = v_payment.wedding_id;
  end if;

  -- Access lives on the account: this is what unlocks onboarding when the
  -- payment was made before a wedding existed.
  insert into public.user_entitlements (user_id, lifetime_access_granted_at, source_payment_id)
  values (v_payment.user_id, now(), p_payment_id)
  on conflict (user_id) do update
  set lifetime_access_granted_at =
        coalesce(public.user_entitlements.lifetime_access_granted_at, excluded.lifetime_access_granted_at),
      source_payment_id =
        coalesce(public.user_entitlements.source_payment_id, excluded.source_payment_id);

  -- Commission: 20% of the amount stored on the payment, in its own currency.
  select r.affiliate_id, r.id into v_affiliate_id, v_referral_id
  from public.affiliate_referrals r
  join public.affiliates a on a.id = r.affiliate_id and a.status = 'active'
  where r.customer_user_id = v_payment.user_id
  limit 1;

  if v_affiliate_id is not null then
    v_base_amount := case
      when v_payment.currency = 'USD' then v_payment.amount_usd
      else v_payment.amount_idr
    end;

    if v_base_amount is not null and v_base_amount > 0 then
      v_commission := round(v_base_amount * 0.20, 2);

      if not exists (
        select 1 from public.affiliate_commissions where payment_id = v_payment.id
      ) then
        insert into public.affiliate_commissions (
          affiliate_id, referral_id, payment_id, payment_reference,
          commission_rate, currency, original_payment_amount, commission_amount, status
        ) values (
          v_affiliate_id, v_referral_id, v_payment.id, v_payment.reference,
          0.2000, v_payment.currency, v_base_amount, v_commission, 'available'
        ) returning id into v_commission_id;

        insert into public.affiliate_ledger (
          affiliate_id, currency, event, amount, commission_id, note
        ) values (
          v_affiliate_id, v_payment.currency, 'commission_earned', v_commission,
          v_commission_id, 'payment ' || coalesce(v_payment.reference, v_payment.id::text)
        );
      end if;
    end if;
  end if;
end;
$$;

revoke all on function public.approve_payment(uuid) from public, anon;
grant execute on function public.approve_payment(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
