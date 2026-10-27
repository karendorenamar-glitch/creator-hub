-- Kefoo Wedding Planner - 030: guest side categories (bride / groom / unassigned).
-- Additive and non-destructive. Existing guests, IDs, wedding links, invitation
-- statuses, RSVP data and contact fields are preserved.
--
-- Existing rows receive 'unassigned' automatically. No existing guest is
-- guessed into either side. The column is required for new writes, while the
-- database still permits 'unassigned' for legacy/imported rows.

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
