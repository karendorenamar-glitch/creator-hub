-- Kefoo — 051: Affiliate program foundation
-- Additive. Does not alter checkout, customer auth, wedding data or existing payments.
-- Commissions are created ONLY inside approve_payment(), i.e. after an admin
-- approves a payment. IDR and USD balances are tracked separately.

begin;

-- ---------------------------------------------------------------------------
-- 1. Affiliates (one profile per auth user; history survives user deletion)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  referral_code text not null unique
    check (referral_code ~ '^[A-Z0-9]{4,16}$'),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  suspended_reason text,
  instagram_username text,
  tiktok_username text,
  bank_name text,
  account_holder_name text,
  bank_account_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliates_status_idx on public.affiliates (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Clicks (one row per visit, written by RPC only)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  session_id text check (session_id is null or char_length(session_id) <= 120),
  landing_page text check (landing_page is null or char_length(landing_page) <= 500),
  referrer_url text check (referrer_url is null or char_length(referrer_url) <= 500),
  clicked_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_affiliate_idx
  on public.affiliate_clicks (affiliate_id, clicked_at desc);

-- ---------------------------------------------------------------------------
-- 3. Referral attribution: one customer can have exactly one affiliate
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  customer_user_id uuid unique references auth.users(id) on delete set null,
  customer_reference text,
  attribution_status text not null default 'attributed'
    check (attribution_status in ('attributed', 'signup', 'revoked')),
  attributed_at timestamptz not null default now(),
  signup_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_referrals_affiliate_idx
  on public.affiliate_referrals (affiliate_id, attributed_at desc);

-- ---------------------------------------------------------------------------
-- 4. Commissions: one per payment, currency follows the payment
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  referral_id uuid references public.affiliate_referrals(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  payment_reference text,
  commission_rate numeric(6, 4) not null default 0.2000
    check (commission_rate > 0 and commission_rate <= 1),
  currency text not null check (currency in ('IDR', 'USD')),
  original_payment_amount numeric(14, 2) not null check (original_payment_amount > 0),
  commission_amount numeric(14, 2) not null check (commission_amount > 0),
  status text not null default 'available'
    check (status in ('available', 'reserved', 'paid', 'reversed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists affiliate_commissions_payment_unique
  on public.affiliate_commissions (payment_id)
  where payment_id is not null;
create index if not exists affiliate_commissions_affiliate_idx
  on public.affiliate_commissions (affiliate_id, currency, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Payouts: one currency per request, bank details are a snapshot
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  currency text not null check (currency in ('IDR', 'USD')),
  amount numeric(14, 2) not null check (amount > 0),
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 80),
  account_holder_name text not null
    check (char_length(trim(account_holder_name)) between 1 and 120),
  bank_account_number text not null
    check (char_length(trim(bank_account_number)) between 4 and 40),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'rejected')),
  exchange_rate_usd_idr numeric(14, 4) check (exchange_rate_usd_idr is null or exchange_rate_usd_idr > 0),
  amount_idr_converted numeric(14, 2) check (amount_idr_converted is null or amount_idr_converted >= 0),
  rate_date date,
  requested_at timestamptz not null default now(),
  processing_at timestamptz,
  paid_at timestamptz,
  rejected_at timestamptz,
  transfer_date date,
  transfer_reference text,
  admin_note text,
  rejection_reason text,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_payouts_status_idx
  on public.affiliate_payouts (status, requested_at desc);
create index if not exists affiliate_payouts_affiliate_idx
  on public.affiliate_payouts (affiliate_id, requested_at desc);

-- ---------------------------------------------------------------------------
-- 6. Append-only ledger: the only source of balances
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_ledger (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  currency text not null check (currency in ('IDR', 'USD')),
  event text not null check (event in (
    'commission_earned', 'commission_reversed',
    'payout_reserved', 'payout_released', 'payout_paid'
  )),
  amount numeric(14, 2) not null check (amount > 0),
  commission_id uuid references public.affiliate_commissions(id) on delete set null,
  payout_id uuid references public.affiliate_payouts(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_ledger_affiliate_idx
  on public.affiliate_ledger (affiliate_id, currency, created_at desc);
create unique index if not exists affiliate_ledger_payout_event_unique
  on public.affiliate_ledger (payout_id, event)
  where payout_id is not null;

-- ---------------------------------------------------------------------------
-- 7. Balances per currency (never a stored, editable balance)
-- ---------------------------------------------------------------------------
create or replace function public.affiliate_balances(p_affiliate_id uuid)
returns table (
  currency text,
  commissions_count bigint,
  earned numeric,
  reserved numeric,
  released numeric,
  paid numeric,
  available numeric,
  pending_payout numeric
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (
    public.is_admin()
    or exists (
      select 1 from public.affiliates a
      where a.id = p_affiliate_id and a.user_id = auth.uid()
    )
  ) then
    raise exception 'Not authorized.';
  end if;

  return query
  with totals as (
    select l.currency,
           sum(case when l.event = 'commission_earned' then l.amount else 0 end) as earned,
           sum(case when l.event = 'payout_reserved' then l.amount else 0 end) as reserved,
           sum(case when l.event = 'payout_released' then l.amount else 0 end) as released,
           sum(case when l.event = 'payout_paid' then l.amount else 0 end) as paid
    from public.affiliate_ledger l
    where l.affiliate_id = p_affiliate_id
    group by l.currency
  ),
  counts as (
    select c.currency, count(*) as total
    from public.affiliate_commissions c
    where c.affiliate_id = p_affiliate_id and c.status <> 'reversed'
    group by c.currency
  )
  select coalesce(t.currency, 'IDR') as currency,
         coalesce(k.total, 0) as commissions_count,
         coalesce(t.earned, 0) as earned,
         coalesce(t.reserved, 0) as reserved,
         coalesce(t.released, 0) as released,
         coalesce(t.paid, 0) as paid,
         -- paid money already sits inside `reserved`, so it is not subtracted twice
         coalesce(t.earned, 0) - coalesce(t.reserved, 0) + coalesce(t.released, 0) as available,
         coalesce(t.reserved, 0) - coalesce(t.paid, 0) as pending_payout
  from totals t
  full join counts k on k.currency = t.currency;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Referral tracking RPCs (server-side validation only)
-- ---------------------------------------------------------------------------
create or replace function public.record_affiliate_click(
  p_code text, p_session text default null, p_landing text default null, p_referrer text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_affiliate uuid;
begin
  select a.id into v_affiliate
  from public.affiliates a
  where a.referral_code = upper(trim(p_code)) and a.status = 'active';

  if v_affiliate is null then return null; end if;

  insert into public.affiliate_clicks (affiliate_id, session_id, landing_page, referrer_url)
  values (v_affiliate, left(p_session, 120), left(p_landing, 500), left(p_referrer, 500));

  return v_affiliate;
end;
$$;

create or replace function public.attribute_affiliate_referral(p_code text, p_customer uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_affiliate public.affiliates%rowtype;
begin
  if p_customer is null or p_customer <> auth.uid() then
    raise exception 'Not authorized.';
  end if;

  select * into v_affiliate from public.affiliates
  where referral_code = upper(trim(p_code)) and status = 'active';

  if not found then return false; end if;
  if v_affiliate.user_id = p_customer then return false; end if; -- self-referral

  insert into public.affiliate_referrals (affiliate_id, customer_user_id, customer_reference, signup_completed_at)
  values (v_affiliate.id, p_customer, left(p_customer::text, 8), now())
  on conflict (customer_user_id) do nothing;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Payout RPCs (reservation and settlement are atomic)
-- ---------------------------------------------------------------------------
create or replace function public.affiliate_request_payout(
  p_currency text, p_amount numeric,
  p_bank text, p_holder text, p_account text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_affiliate public.affiliates%rowtype;
  v_available numeric;
  v_min numeric;
  v_payout uuid;
begin
  if p_currency not in ('IDR', 'USD') then raise exception 'Invalid currency.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount.'; end if;

  select * into v_affiliate from public.affiliates
  where user_id = auth.uid() and status = 'active' for update;
  if not found then raise exception 'Affiliate not active.'; end if;

  v_min := case when p_currency = 'IDR' then 6000 else 0.60 end;
  if p_amount < v_min then raise exception 'Below minimum payout.'; end if;

  select coalesce(available, 0) into v_available
  from public.affiliate_balances(v_affiliate.id) where currency = p_currency;

  if coalesce(v_available, 0) < p_amount then raise exception 'Insufficient balance.'; end if;

  insert into public.affiliate_payouts (
    affiliate_id, currency, amount, bank_name, account_holder_name, bank_account_number, status
  ) values (
    v_affiliate.id, p_currency, p_amount, trim(p_bank), trim(p_holder), trim(p_account), 'pending'
  ) returning id into v_payout;

  insert into public.affiliate_ledger (affiliate_id, currency, event, amount, payout_id)
  values (v_affiliate.id, p_currency, 'payout_reserved', p_amount, v_payout);

  return v_payout;
end;
$$;

create or replace function public.affiliate_payout_processing(p_payout uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized.'; end if;

  update public.affiliate_payouts
  set status = 'processing', processing_at = now(), processed_by = auth.uid()
  where id = p_payout and status = 'pending';

  if not found then raise exception 'Only pending payouts can be processed.'; end if;
end;
$$;

create or replace function public.affiliate_payout_paid(
  p_payout uuid, p_transfer_date date, p_reference text, p_rate numeric, p_note text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_payout public.affiliate_payouts%rowtype;
  v_converted numeric;
begin
  if not public.is_admin() then raise exception 'Not authorized.'; end if;

  select * into v_payout from public.affiliate_payouts where id = p_payout for update;
  if not found then raise exception 'Payout not found.'; end if;
  if v_payout.status not in ('pending', 'processing') then
    raise exception 'Payout already settled.';
  end if;
  if p_transfer_date is null or coalesce(trim(p_reference), '') = '' then
    raise exception 'Transfer date and reference are required.';
  end if;

  if v_payout.currency = 'USD' then
    if p_rate is null or p_rate <= 0 then
      raise exception 'A USD/IDR exchange rate is required for USD payouts.';
    end if;
    v_converted := round(v_payout.amount * p_rate, 2);
  else
    v_converted := v_payout.amount;
  end if;

  update public.affiliate_payouts
  set status = 'paid', paid_at = now(), transfer_date = p_transfer_date,
      transfer_reference = trim(p_reference),
      exchange_rate_usd_idr = case when currency = 'USD' then p_rate else null end,
      amount_idr_converted = v_converted,
      rate_date = case when currency = 'USD' then p_transfer_date else null end,
      admin_note = nullif(left(coalesce(p_note, ''), 500), ''),
      processed_by = auth.uid()
  where id = p_payout;

  insert into public.affiliate_ledger (affiliate_id, currency, event, amount, payout_id, note)
  values (v_payout.affiliate_id, v_payout.currency, 'payout_paid', v_payout.amount, p_payout, 'transfer ' || trim(p_reference));
end;
$$;

create or replace function public.affiliate_payout_reject(p_payout uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_payout public.affiliate_payouts%rowtype;
begin
  if not public.is_admin() then raise exception 'Not authorized.'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Rejection reason is required.'; end if;

  select * into v_payout from public.affiliate_payouts where id = p_payout for update;
  if not found then raise exception 'Payout not found.'; end if;
  if v_payout.status not in ('pending', 'processing') then
    raise exception 'Payout already settled.';
  end if;

  update public.affiliate_payouts
  set status = 'rejected', rejected_at = now(), rejection_reason = left(trim(p_reason), 500),
      processed_by = auth.uid()
  where id = p_payout;

  insert into public.affiliate_ledger (affiliate_id, currency, event, amount, payout_id, note)
  values (v_payout.affiliate_id, v_payout.currency, 'payout_released', v_payout.amount, p_payout, 'rejected');
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Commission creation inside the existing approval RPC
--     Original body preserved verbatim; the commission block only runs after
--     the payment really became 'approved'.
-- ---------------------------------------------------------------------------
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

  if not exists (
    select 1 from public.wedding_members m
    where m.wedding_id = v_payment.wedding_id
      and m.user_id = v_payment.user_id
  ) then
    raise exception 'Payment is not linked to a wedding of this customer.';
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

  -- Commission: 20% of the amount actually stored on the payment row, in the
  -- currency the customer paid. No conversion happens here.
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

-- ---------------------------------------------------------------------------
-- 11. RLS: affiliates read only their own rows; nobody writes finances directly
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['affiliates','affiliate_clicks','affiliate_referrals',
                           'affiliate_commissions','affiliate_payouts','affiliate_ledger']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

drop policy if exists "Affiliates read own profile" on public.affiliates;
create policy "Affiliates read own profile" on public.affiliates
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Affiliates update own profile" on public.affiliates;
create policy "Affiliates update own profile" on public.affiliates
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant update (full_name, instagram_username, tiktok_username,
              bank_name, account_holder_name, bank_account_number)
  on public.affiliates to authenticated;

drop policy if exists "Affiliates read own clicks" on public.affiliate_clicks;
create policy "Affiliates read own clicks" on public.affiliate_clicks
  for select to authenticated
  using (exists (select 1 from public.affiliates a
                 where a.id = affiliate_id
                   and (a.user_id = auth.uid() or public.is_admin())));

drop policy if exists "Affiliates read own referrals" on public.affiliate_referrals;
create policy "Affiliates read own referrals" on public.affiliate_referrals
  for select to authenticated
  using (exists (select 1 from public.affiliates a
                 where a.id = affiliate_id
                   and (a.user_id = auth.uid() or public.is_admin())));

drop policy if exists "Affiliates read own commissions" on public.affiliate_commissions;
create policy "Affiliates read own commissions" on public.affiliate_commissions
  for select to authenticated
  using (exists (select 1 from public.affiliates a
                 where a.id = affiliate_id
                   and (a.user_id = auth.uid() or public.is_admin())));

drop policy if exists "Affiliates read own payouts" on public.affiliate_payouts;
create policy "Affiliates read own payouts" on public.affiliate_payouts
  for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.user_id = auth.uid()));

drop policy if exists "Affiliates read own ledger" on public.affiliate_ledger;
create policy "Affiliates read own ledger" on public.affiliate_ledger
  for select to authenticated
  using (exists (select 1 from public.affiliates a
                 where a.id = affiliate_id
                   and (a.user_id = auth.uid() or public.is_admin())));

-- RPC grants: clicks are recorded for anonymous visitors too.
revoke all on function public.record_affiliate_click(text, text, text, text) from public;
grant execute on function public.record_affiliate_click(text, text, text, text) to anon, authenticated;

revoke all on function public.attribute_affiliate_referral(text, uuid) from public, anon;
grant execute on function public.attribute_affiliate_referral(text, uuid) to authenticated;

revoke all on function public.affiliate_balances(uuid) from public, anon;
grant execute on function public.affiliate_balances(uuid) to authenticated;

revoke all on function public.affiliate_request_payout(text, numeric, text, text, text) from public, anon;
grant execute on function public.affiliate_request_payout(text, numeric, text, text, text) to authenticated;

revoke all on function public.affiliate_payout_processing(uuid) from public, anon;
revoke all on function public.affiliate_payout_paid(uuid, date, text, numeric, text) from public, anon;
revoke all on function public.affiliate_payout_reject(uuid, text) from public, anon;
grant execute on function public.affiliate_payout_processing(uuid) to authenticated;
grant execute on function public.affiliate_payout_paid(uuid, date, text, numeric, text) to authenticated;
grant execute on function public.affiliate_payout_reject(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
