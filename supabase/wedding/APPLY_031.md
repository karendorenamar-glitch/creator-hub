# Apply migration 031 (seating, floor plan and rooms)

Migration `031_seating_rooms.sql` is additive and must be reviewed before
deploying the seating/rooms UI. It does not alter or delete existing guests.

What it adds:

- `seating_events` with fixed `akad` and `dinner` event types;
- `seating_tables` with shape, capacity, dimensions and canvas position;
- `seating_assignments` (unique per event + guest);
- `rooms` with type, capacity, breakfast configuration and dates;
- `room_assignments` (unique per wedding + guest);
- composite foreign keys that keep guests, tables, events and rooms inside the
  same wedding;
- RLS policies using the existing `wedding_has_access(wedding_id)` rule;
- default Akad and Dinner event rows for existing weddings.

The migration also adds a unique index on `(id, wedding_id)` for guests so the
new composite foreign keys can preserve referential integrity.

Run manually in the Supabase SQL Editor after 030:

1. Paste and run the full `031_seating_rooms.sql`.
2. Confirm the tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'seating_events', 'seating_tables', 'seating_assignments',
    'rooms', 'room_assignments'
  )
order by table_name;
```

3. Confirm each wedding has two seating events:

```sql
select wedding_id, event_type, name
from public.seating_events
order by wedding_id, event_type;
```

4. Spot-check RLS is enabled:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'seating_events', 'seating_tables', 'seating_assignments',
  'rooms', 'room_assignments'
);
```

Expected: five rows with `relrowsecurity = true`.

No service-role key is used by the application. All mutations continue through
the signed-in Supabase client and RLS. Existing invitation and RSVP flows are
not changed.

Before this migration is applied, the seating and rooms pages show an explicit
migration-required message and do not write anything.
