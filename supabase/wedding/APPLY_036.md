# Apply migration 036 — donor-funded costs

Run `supabase/wedding/036_donor_funded_costs.sql` after migration 035.

It adds `funded_by_donor` to `vendors` and `expenses`. A donor-funded cost is
included in coverage as paid, and the same amount is deducted from the
available donation pool. No existing row is changed.

## Verify

```sql
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and column_name = 'funded_by_donor'
order by table_name;
```

Expected: one row for `expenses` and one for `vendors`, both `NO` nullable
with default `false`.
