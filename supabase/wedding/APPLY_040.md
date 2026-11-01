# Apply 040 — Debt Tracker

This is an additive migration for the private Debt Tracker. It does not alter
any existing Wedding Planner object.

## Before running

1. Confirm you are in the correct Supabase project.
2. Confirm the latest applied Wedding Planner migration. `039` is superseded
   and must not be run.
3. Read `supabase/wedding/040_debt_tracker.sql` in full.
4. Obtain explicit approval. This project does not auto-apply migrations.

## Run

Open Supabase Dashboard → SQL Editor → paste and run the complete file.

## Bootstrap the owner

Follow `docs/DEBT_TRACKER.md`. The owner must already exist in `auth.users`.
Never authorize the first person who signs in.

## After running

Check that the tables, policies, and function exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name like 'debt_%'
order by table_name;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'is_debt_owner';
```

Then run the authorization and payment tests described in the Debt Tracker
documentation.
