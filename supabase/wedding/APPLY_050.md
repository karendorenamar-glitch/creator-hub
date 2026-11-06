# Apply 050 — partner nationality

One nullable column with a CHECK over the supported ISO codes. No row is
rewritten and existing checklists are untouched.

- `NULL` = the customer has not told us yet (never assume Malaysian or foreign).
- `MY` = partner is Malaysian → standard Malaysian checklist (37 items).
- `ID` / `SG` / `US` / `GB` / `AU` = partner is a foreign national → the 37
  items plus the 7 foreign-spouse documents.

## Run

Supabase SQL Editor → `supabase/wedding/050_partner_nationality.sql`.
Idempotent (`add column if not exists`, constraint dropped and re-added).

## Verify

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'weddings' and column_name = 'partner_nationality';
```

## Rollback

```sql
alter table public.weddings drop constraint if exists weddings_partner_nationality_check;
alter table public.weddings drop column if exists partner_nationality;
```

Rolling back only loses the nationality answers; checklist rows stay.
