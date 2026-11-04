-- Kefoo — 045: customer country + country-based one-time pricing
-- Additive. Existing payments, entitlements and users are untouched.

begin;

-- 1. Country chosen at registration (or later, before paying).
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  country_code text not null
    check (country_code in ('ID', 'MY', 'SG', 'US', 'GB', 'AU', 'OTHER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_profiles_updated_at on public.customer_profiles;
create trigger customer_profiles_updated_at before update on public.customer_profiles
  for each row execute function public.set_updated_at();

alter table public.customer_profiles enable row level security;

-- Customers read and write only their own row. No delete policy.
drop policy if exists "Customers read own profile" on public.customer_profiles;
create policy "Customers read own profile" on public.customer_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers insert own profile" on public.customer_profiles;
create policy "Customers insert own profile" on public.customer_profiles
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Customers update own profile" on public.customer_profiles;
create policy "Customers update own profile" on public.customer_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.customer_profiles to authenticated;
revoke all on public.customer_profiles from anon;

-- 2. International price is USD 3.00 (one-time lifetime access).
alter table public.payments drop constraint if exists payments_amount_usd_check;
alter table public.payments
  add constraint payments_amount_usd_check
  check (amount_usd is null or amount_usd = 3.00);

-- 3. Server-side price + payment-method enforcement per country.
--    Indonesian customers: BCA transfer only, IDR 30,000.
--    Everyone else: PayPal only, USD 3.00.
drop policy if exists "Customers submit own payment" on public.payments;
create policy "Customers submit own payment" on public.payments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending_review'
    and char_length(trim(sender_name)) between 1 and 120
    and (
      (
        method = 'bank_transfer'
        and currency = 'IDR'
        and amount_idr = 30000
        and amount_usd is null
        and receipt_path is not null
        and exists (
          select 1 from public.customer_profiles p
          where p.user_id = auth.uid() and p.country_code = 'ID'
        )
      )
      or
      (
        method = 'paypal'
        and currency = 'USD'
        and amount_idr = 0
        and amount_usd = 3.00
        and receipt_path is null
        and payer_email is not null
        and char_length(trim(payer_email)) between 5 and 200
        and paypal_transaction_id is not null
        and char_length(trim(paypal_transaction_id)) between 6 and 64
        and exists (
          select 1 from public.customer_profiles p
          where p.user_id = auth.uid() and p.country_code <> 'ID'
        )
      )
    )
  );

notify pgrst, 'reload schema';

commit;
