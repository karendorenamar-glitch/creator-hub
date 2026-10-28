# Apply migration 039 — one guest row per person

Run `supabase/wedding/039_split_plus_ones.sql` in the Supabase SQL Editor **after
all earlier migrations**. This is a data-only migration; it does not alter the
schema.

It converts every existing `guests.plus_ones = N` row into `N + 1` guest rows:

- every row keeps the same name, phone, side, group, invitation status, RSVP
  status and notes;
- every row gets `plus_ones = 0`;
- one multi-chair assignment keeps its first chair; the new companion rows start
  unassigned so they can be placed one by one.

## Before running

Take a database backup or export the `guests` and `seating_assignments` tables.

## Verify

Check that no guest still has companions:

```sql
select count(*) as guests_with_plus_ones
from public.guests
where plus_ones > 0;
```

Expected: `0`.

Check the number of people is unchanged:

```sql
select
  sum(1 + plus_ones) as people
from public.guests;
```

Run this before and after; the result should stay the same.

## Rollback

There is no automatic rollback because the new rows are real guest records. If
needed, restore the backup taken before applying the migration.
