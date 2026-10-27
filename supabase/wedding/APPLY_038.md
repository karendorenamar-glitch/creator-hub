# Apply migration 038 — allocation source links

Run `supabase/wedding/038_donation_allocation_source.sql` after 037.

It adds nullable `expense_id` / `vendor_id` to `donation_allocations` and unique
partial indexes so one donor-funded cost has at most one automatic allocation.
Existing manual allocations remain unchanged.

## Verify

```sql
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'donation_allocations'
  and column_name in ('expense_id', 'vendor_id')
order by column_name;
```

Expected: two rows, both nullable.

```sql
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'donation_allocations'
  and indexname in (
    'donation_allocations_expense_source_idx',
    'donation_allocations_vendor_source_idx'
  );
```

Expected: two rows.
