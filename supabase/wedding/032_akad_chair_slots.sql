-- Kefoo Wedding Planner - 032: individual chair slots for the akad rows.
-- Additive/non-destructive. Dinner table assignments keep seat_index = null.

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
