-- Kefoo — 042 Debt Tracker installment amount
-- Additive column so a monthly installment amount can drive the remaining
-- balance independently from the total recorded payment history.

begin;

alter table public.debt_accounts
  add column if not exists installment_amount numeric(14, 0) not null default 0
    check (installment_amount >= 0);

-- Existing accounts with a tenor but no per-installment amount get a sensible
-- backfill from total / tenor. Existing amount values are never overwritten.
update public.debt_accounts
set installment_amount = round(total_amount_due / installment_total_months)::numeric(14, 0)
where installment_amount = 0
  and installment_total_months > 0
  and total_amount_due > 0;

notify pgrst, 'reload schema';

commit;
