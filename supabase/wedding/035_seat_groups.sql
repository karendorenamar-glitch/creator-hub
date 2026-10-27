-- Kefoo Wedding Planner - 035: reserve all seats for a multi-person guest.
-- A guest record with plus_ones keeps ONE assignment row per event, but that
-- row now owns an array of adjacent chair IDs. This keeps duplicate-assignment
-- protection while making a 2 pax guest occupy two chairs.

alter table public.seating_assignments
  add column if not exists seat_ids uuid[] not null default '{}';

create index if not exists seating_assignments_seat_ids_idx
  on public.seating_assignments using gin (seat_ids);

notify pgrst, 'reload schema';
