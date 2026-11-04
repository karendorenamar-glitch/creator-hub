# Apply 048 — allow `allocation` in `financial_entries`

One CHECK constraint. No table rebuild, no data change, no historical row
touched. Requires `047_financial_entry_currency.sql` to have been applied.

## Why

`public.financial_entries.module` was created in 047 with:

```text
wedding_budget, budget_category, vendor, vendor_option,
vendor_payment, expense, other_cost, donation
```

The budget-allocation module needs to record what the customer typed, so it
writes `module = 'allocation'`. Without this migration that insert is rejected
by the CHECK (the base IDR amount still saves; only the audit row is skipped).

## How

Open the Supabase SQL Editor and run the whole file:

```text
supabase/wedding/048_allocation_module.sql
```

It is idempotent and safe to run twice: it drops any CHECK that guards
`module`, then re-adds one named `financial_entries_module_check` only if it is
missing. If 047 has not been applied yet, every block exits without error.

## Verify

```sql
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.financial_entries'::regclass
  and conname = 'financial_entries_module_check';
```

Expected to contain:

```text
ARRAY['wedding_budget'::text, 'budget_category'::text, 'vendor'::text,
      'vendor_option'::text, 'vendor_payment'::text, 'expense'::text,
      'other_cost'::text, 'donation'::text, 'allocation'::text]
```

## Rollback

```sql
alter table public.financial_entries
  drop constraint if exists financial_entries_module_check;

alter table public.financial_entries
  add constraint financial_entries_module_check check (module in (
    'wedding_budget','budget_category','vendor','vendor_option',
    'vendor_payment','expense','other_cost','donation'
  ));
```

Only roll back if no `allocation` rows exist yet; otherwise delete those rows
first.
