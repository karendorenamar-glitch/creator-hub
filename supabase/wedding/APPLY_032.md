# Apply migration 032 (Akad chair slots)

Migration `032_akad_chair_slots.sql` is additive and adds an optional
`seat_index` to seating assignments so guests can be dropped onto individual
Akad chairs. Dinner table assignments continue to use `seat_index = null`.

Run after 031:

```sql
alter table public.seating_assignments
  add column if not exists seat_index integer;

alter table public.seating_assignments
  drop constraint if exists seating_assignments_seat_index_check;

alter table public.seating_assignments
  add constraint seating_assignments_seat_index_check
  check (seat_index is null or seat_index between 0 and 99);

create unique index if not exists seating_assignments_seat_unique
  on public.seating_assignments (table_id, seat_index)
  where seat_index is not null;

notify pgrst, 'reload schema';
```

Verify:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seating_assignments'
  and column_name = 'seat_index';
```

Expected: `integer`, nullable.

The seating page still loads before this migration, but assigning to an
individual Akad chair needs it. Apply before deploying the revised planner.
