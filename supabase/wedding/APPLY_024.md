# Apply migration 024 (remove collaboration type)

Migration `024_drop_vendor_collaboration_type.sql` removes the retired
`vendors.collaboration_type` field.

It is intentionally destructive only for that new field:

- drops `vendors_collaboration_type_check`;
- drops `vendors.collaboration_type`;
- does **not** touch `collaboration_completed_at`, payments, proofs, vendors,
  inspiration data, or agreed prices.

Do not apply without explicit approval. Existing collaboration-type values are
discarded.

Apply only **after** the code that no longer reads/writes `collaboration_type` is
deployed. The currently released code still selects this column, so dropping it
first would break Budget/Vendors/Dashboard.

Run after 023 and after that deployment in the production SQL Editor, then verify:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'vendors'
  and column_name in ('collaboration_type', 'collaboration_completed_at')
order by column_name;
```

Expected:

- `collaboration_type` — **no row**
- `collaboration_completed_at` — `timestamp with time zone`, nullable

Also verify the retired constraint is gone:

```sql
select conname
from pg_constraint
where conname = 'vendors_collaboration_type_check';
```

Expected: **no rows**.
