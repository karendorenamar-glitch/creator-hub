# Apply 049 — country and state marriage checklists

Two additive schema changes. No row is rewritten, no checklist item is deleted,
and existing Indonesian progress stays exactly as it is.

## What it changes

1. `public.weddings.state_code` (text, nullable) with a CHECK for the 14
   Malaysian states. Stored per wedding because each wedding project can have
   its own administration needs.
2. `public.checklists.kind` now accepts `builtin_my` and `builtin_generic` in
   addition to `custom` and `builtin_kua`.

## How to run

Supabase SQL Editor → run `supabase/wedding/049_marriage_templates.sql`.
Idempotent: `add column if not exists`, and both constraints are dropped and
re-added.

## Verify

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'weddings' and column_name = 'state_code';

select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.checklists'::regclass
  and conname = 'checklists_kind_check';
```

Expected: the constraint lists `custom`, `builtin_kua`, `builtin_my`,
`builtin_generic`.

## Rollback

```sql
alter table public.weddings drop constraint if exists weddings_state_code_check;
alter table public.weddings drop column if exists state_code;

alter table public.checklists drop constraint if exists checklists_kind_check;
alter table public.checklists
  add constraint checklists_kind_check
  check (kind in ('custom', 'builtin_kua'));
```

Only roll back when no `builtin_my` / `builtin_generic` checklist rows exist.
