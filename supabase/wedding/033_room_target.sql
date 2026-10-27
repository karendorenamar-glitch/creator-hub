-- Kefoo Wedding Planner - 033: manual total room allocation.
-- Additive/non-destructive. Existing rooms and assignments are unchanged.

alter table public.weddings
  add column if not exists room_target integer;

alter table public.weddings
  drop constraint if exists weddings_room_target_check;

alter table public.weddings
  add constraint weddings_room_target_check
  check (room_target is null or room_target between 0 and 1000);

notify pgrst, 'reload schema';
