# Apply 041 — Debt Tracker installments

This migration adds recurring due day and installment status to
`public.debt_accounts`.

## Additive changes

- `installment_month` — current month/installment number, default `0`.
- `installment_total_months` — total tenor, default `0`.
- `due_day` — recurring due date, valid `1–31`.
- Backfill `due_day` from existing `due_date` values.
- Does not alter or delete existing debt accounts or payments.

## Before running

1. Confirm you are in the Supabase project used by production.
2. Confirm `040_debt_tracker.sql` is already applied.
3. Review `041_debt_installments.sql`.
4. Obtain approval; migrations are manual.

## Run

Open Supabase Dashboard → SQL Editor → paste the complete file → Run.

## Verify

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'debt_accounts'
  and column_name in (
    'installment_month',
    'installment_total_months',
    'due_day'
  )
order by column_name;
```

Expected: three rows.

After this migration, the updated account form can save:
- `5/12` installment status,
- recurring due day (for example, every 5th),
- multiple loans under the same application/creditor.
