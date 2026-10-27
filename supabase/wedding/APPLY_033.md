# Apply migration 033 (manual room total)

Migration `033_room_target.sql` adds an optional manual room allocation to the
wedding workspace. It does not change existing rooms, guests or assignments.

Run after 031:

```sql
alter table public.weddings
  add column if not exists room_target integer;

alter table public.weddings
  drop constraint if exists weddings_room_target_check;

alter table public.weddings
  add constraint weddings_room_target_check
  check (room_target is null or room_target between 0 and 1000);

notify pgrst, 'reload schema';
```

Verify:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'weddings'
  and column_name = 'room_target';
```

Expected: `integer`, nullable.

After this migration, the Rooms page can save the total room allocation. The
value is used only for room planning; it does not create rooms or assign guests.
