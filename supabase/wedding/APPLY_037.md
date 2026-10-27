# Apply migration 037 — donation allocations

Run `supabase/wedding/037_donation_allocations.sql` after migration 036.

It adds `donation_allocations`, linking a donation to a need label and an
optional budget category. Allocations are earmarks, not cash payments.

## Verify

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'donation_allocations'
order by ordinal_position;
```

Expected columns: `id`, `wedding_id`, `donation_id`, `category_id`, `label`,
`amount`, `created_at`, `updated_at`.

```sql
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'donation_allocations';
```

Expected: donation, wedding, and category indexes.

The trigger prevents an allocation total from exceeding its donation amount,
and prevents lowering a donation below its allocated total.
