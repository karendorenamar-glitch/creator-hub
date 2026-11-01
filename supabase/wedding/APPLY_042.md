# Apply 042 — Debt Tracker installment amount

Adds the per-installment nominal so the account can calculate:

```text
remaining = (total_tenor - paid_installments) × nominal_per_installment
```

Example:

```text
nominal per installment : 200.000
paid installment status : 10/12
remaining               : 2 × 200.000 = 400.000
```

## Additive changes

- `installment_amount numeric(14,0) not null default 0`
- Backfill for existing accounts with `installment_total_months > 0` using
  `total_amount_due / installment_total_months`.
- Existing `installment_amount` values are never overwritten.
- No existing debt/payment records are deleted.

## Run

After `041`, open Supabase SQL Editor and run the complete file:

```text
supabase/wedding/042_debt_installment_amount.sql
```

Verify:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'debt_accounts'
  and column_name = 'installment_amount';
```

Expected: one row.
