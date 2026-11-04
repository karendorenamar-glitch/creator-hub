-- Kefoo — 044: PayPal lifetime payments (USD 2.99)
-- Additive. Keeps the existing BCA bank-transfer flow untouched.
-- Review and run manually in the Supabase SQL editor after approval.

begin;

alter table public.payments
  add column if not exists amount_usd numeric(10, 2),
  add column if not exists payer_email text,
  add column if not exists paypal_transaction_id text;

-- amount_idr keeps its meaning for BCA rows; PayPal rows store USD instead.
alter table public.payments drop constraint if exists payments_amount_idr_check;
alter table public.payments
  add constraint payments_amount_idr_check
  check (amount_idr = 30000 or (amount_idr = 0 and method = 'paypal'));

alter table public.payments drop constraint if exists payments_currency_check;
alter table public.payments
  add constraint payments_currency_check
  check (currency in ('IDR', 'USD'));

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('bank_transfer', 'paypal'));

-- A PayPal transaction ID can only be submitted once.
create unique index if not exists payments_paypal_tx_unique_idx
  on public.payments (paypal_transaction_id)
  where paypal_transaction_id is not null;

-- Customers may submit either a BCA receipt or a PayPal transaction ID.
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
        and receipt_path is not null
      )
      or
      (
        method = 'paypal'
        and currency = 'USD'
        and amount_idr = 0
        and amount_usd = 2.99
        and receipt_path is null
        and payer_email is not null
        and char_length(trim(payer_email)) between 5 and 200
        and paypal_transaction_id is not null
        and char_length(trim(paypal_transaction_id)) between 6 and 64
      )
    )
  );

notify pgrst, 'reload schema';

commit;
