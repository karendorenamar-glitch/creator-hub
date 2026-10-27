# Apply migration 034 — individual chairs

Run `supabase/wedding/034_individual_chairs.sql` in the Supabase SQL editor
for the Kefoo project.

This migration is additive:

- adds `kind`, `side`, `rotation` and `parent_table_id` to `seating_tables`;
- adds draggable stage coordinates to `seating_events`;
- marks the existing Akad one-person seat rows as `kind = 'chair'`;
- adds a self-referencing parent FK so Dinner chairs are deleted with their table.

## Verify

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seating_tables'
  and column_name in ('kind', 'side', 'rotation', 'parent_table_id')
order by column_name;
```

Expected: four rows.

```sql
select kind, side, count(*)
from public.seating_tables
group by kind, side
order by kind, side;
```

Expected: Akad chairs are `kind = 'chair'` with `side` left/right. Existing
Dinner tables stay `kind = 'table'`.

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seating_events'
  and column_name in ('stage_x', 'stage_y')
order by column_name;
```

Expected: two rows.

No existing guest or assignment row is deleted by this migration.
