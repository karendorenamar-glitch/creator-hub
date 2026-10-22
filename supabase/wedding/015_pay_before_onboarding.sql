-- Kefoo Wedding Planner - 015: pay first, create the wedding afterwards.
-- Run FIFTEENTH, after 014. Additive, keeps existing data intact.
--
-- Access moves from the wedding to the ACCOUNT, so a customer can pay before
-- any wedding exists. Flow: sign up -> pay -> onboarding -> dashboard.

-- 1. Entitlement lives on the user.
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lifetime_access_granted_at timestamptz,
  source_payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_entitlements_updated_at on public.user_entitlements;
create trigger user_entitlements_updated_at before update on public.user_entitlements
  for each row execute function public.set_updated_at();

alter table public.user_entitlements enable row level security;

-- Customers may read only their own entitlement. No write policy: only the
-- approval function / service role can grant access.
drop policy if exists "Users read own entitlement" on public.user_entitlements;
create policy "Users read own entitlement" on public.user_entitlements
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.user_entitlements from anon, authenticated;
grant select on public.user_entitlements to authenticated;

-- 2. Carry over existing lifetime grants from weddings (idempotent).
insert into public.user_entitlements (user_id, lifetime_access_granted_at, source_payment_id)
select w.created_by, w.lifetime_access_granted_at, w.lifetime_access_payment_id
from public.weddings w
where w.lifetime_access_granted_at is not null
on conflict (user_id) do update
set lifetime_access_granted_at =
      coalesce(public.user_entitlements.lifetime_access_granted_at, excluded.lifetime_access_granted_at),
    source_payment_id =
      coalesce(public.user_entitlements.source_payment_id, excluded.source_payment_id);

-- 3. Payments no longer require a wedding (customers pay before onboarding).
alter table public.payments alter column wedding_id drop not null;

alter table public.payments drop constraint if exists payments_wedding_id_fkey;
alter table public.payments
  add constraint payments_wedding_id_fkey
  foreign key (wedding_id) references public.weddings(id) on delete set null;

-- The one-open-payment-per-user index stays; it already keys on user_id.

-- 4. Insert policy: no wedding check any more, everything else unchanged.
drop policy if exists "Customers submit own payment" on public.payments;
create policy "Customers submit own payment" on public.payments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and amount_idr = 30000
    and status = 'pending_review'
    and receipt_path is not null
    and char_length(trim(sender_name)) between 1 and 120
  );
-- 5. Approval grants the entitlement to the ACCOUNT (and to the wedding when
--    one is already linked), atomically and idempotently.
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

  update public.payments
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(),
      rejection_reason = null
  where id = p_payment_id;

  -- Account-level access (works even without a wedding yet).
  insert into public.user_entitlements (user_id, lifetime_access_granted_at, source_payment_id)
  values (v_payment.user_id, now(), p_payment_id)
  on conflict (user_id) do update
  set lifetime_access_granted_at =
        coalesce(public.user_entitlements.lifetime_access_granted_at, now()),
      source_payment_id =
        coalesce(public.user_entitlements.source_payment_id, excluded.source_payment_id);

  -- Keep the wedding flag for payments that already reference a wedding.
  if v_payment.wedding_id is not null then
    update public.weddings
    set lifetime_access_granted_at = coalesce(lifetime_access_granted_at, now()),
        lifetime_access_payment_id = p_payment_id
    where id = v_payment.wedding_id;
  end if;
end;
$$;

-- 6. Access = wedding member AND the account owns a lifetime entitlement
--    (legacy per-wedding grant and active subscription still count).
create or replace function public.wedding_has_access(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_wedding_member(p_wedding_id)
     and (
       not public.requires_subscription()
       or public.has_active_subscription(p_wedding_id)
       or exists (
         select 1 from public.weddings w
         where w.id = p_wedding_id
           and w.lifetime_access_granted_at is not null
       )
       or exists (
         select 1
         from public.weddings w
         join public.user_entitlements e on e.user_id = w.created_by
         where w.id = p_wedding_id
           and e.lifetime_access_granted_at is not null
       )
     );
$$;

revoke all on function public.approve_payment(uuid) from public, anon;
revoke all on function public.wedding_has_access(uuid) from public, anon;
grant execute on function public.approve_payment(uuid) to authenticated;
grant execute on function public.wedding_has_access(uuid) to authenticated;

notify pgrst, 'reload schema';
