# Apply migration 035 — multi-seat guests

Run `supabase/wedding/035_seat_groups.sql` after migration 034.

This is additive: it adds `seating_assignments.seat_ids` and a GIN index.
No assignment row is deleted. A guest still has one assignment per event;
the extra chairs are stored on the same assignment.

## Verify

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seating_assignments'
  and column_name = 'seat_ids';
```

Expected: one row with type `ARRAY` and default `'{}'`.

```sql
select table_name, indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'seating_assignments_seat_ids_idx';
```

Expected: one row.
