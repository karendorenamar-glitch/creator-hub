# Apply migration 030 (guest side categories)

Migration `030_guest_side.sql` is additive and preserves every existing guest
record. It must be reviewed and applied before deploying the Bride/Groom guest
UI.

What it adds:

- `public.guests.side` with allowed values `bride`, `groom`, `unassigned`;
- existing guests are set to `unassigned` (never guessed);
- a default of `unassigned` for legacy/imported inserts;
- an index on `(wedding_id, side)`.

It does not change RLS policies or grants. The existing `guests` policy already
covers the new column.

Run manually in the Supabase SQL Editor after 029:

```sql
alter table public.guests
  add column if not exists side text;

update public.guests
set side = 'unassigned'
where side is null;

alter table public.guests
  alter column side set default 'unassigned';

alter table public.guests
  alter column side set not null;

alter table public.guests
  drop constraint if exists guests_side_check;

alter table public.guests
  add constraint guests_side_check
  check (side in ('bride', 'groom', 'unassigned'));

create index if not exists guests_wedding_side_idx
  on public.guests (wedding_id, side);

notify pgrst, 'reload schema';
```

Verify:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'guests'
  and column_name = 'side';

select side, count(*)
from public.guests
group by side
order by side;
```

Expected: `side` is `text`, not nullable, default `'unassigned'`, and every
existing row shows `unassigned` until the user assigns it manually.

The app requires this migration before adding or editing guests, because the
form now writes and validates `side`. Apply it before deploying the related UI.
