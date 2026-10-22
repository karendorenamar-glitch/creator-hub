-- Kefoo Wedding Planner - 016: fix approve_payment after "pay before onboarding".
-- Run SIXTEENTH, after 015. Idempotent and safe to re-run.
--
-- Why: migration 012's approve_payment required the payment to be linked to a
-- wedding the customer belongs to. With the new flow a customer pays BEFORE
-- onboarding, so wedding_id is NULL and approval failed with
-- "Payment is not linked to a wedding of this customer."

create or replace function public.approve_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
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

  -- Only validate membership when the payment already points at a wedding.
  -- A NULL wedding_id means the customer pays before onboarding, which is valid.
  if v_payment.wedding_id is not null then
    if not exists (
      select 1 from public.wedding_members m
      where m.wedding_id = v_payment.wedding_id
        and m.user_id = v_payment.user_id
    ) then
      raise exception 'Payment is linked to a wedding this customer does not belong to.';
    end if;
  end if;

  update public.payments
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(),
      rejection_reason = null
  where id = p_payment_id;

  -- Account-level access: works even when no wedding exists yet.
  insert into public.user_entitlements (user_id, lifetime_access_granted_at, source_payment_id)
  values (v_payment.user_id, now(), p_payment_id)
  on conflict (user_id) do update
  set lifetime_access_granted_at =
        coalesce(public.user_entitlements.lifetime_access_granted_at, now()),
      source_payment_id =
        coalesce(public.user_entitlements.source_payment_id, excluded.source_payment_id);

  -- Keep the legacy per-wedding flag for payments that carry a wedding.
  if v_payment.wedding_id is not null then
    update public.weddings
    set lifetime_access_granted_at = coalesce(lifetime_access_granted_at, now()),
        lifetime_access_payment_id = p_payment_id
    where id = v_payment.wedding_id;
  end if;
end;
$$;

-- Version marker so you can confirm which definition is live.
create or replace function public.approve_payment_version()
returns text
language sql stable
as $$ select '016'::text; $$;

revoke all on function public.approve_payment(uuid) from public, anon;
revoke all on function public.approve_payment_version() from public, anon;
grant execute on function public.approve_payment(uuid) to authenticated;
grant execute on function public.approve_payment_version() to authenticated;

notify pgrst, 'reload schema';