-- Kefoo Wedding Planner - 034: individual chair objects and table-aware seats.
-- Additive/non-destructive. Existing table rows remain tables; new/derived
-- seats are chair rows with their own IDs, positions and assignments.

alter table public.seating_tables
  add column if not exists kind text not null default 'table';

alter table public.seating_tables
  drop constraint if exists seating_tables_kind_check;

alter table public.seating_tables
  add constraint seating_tables_kind_check
  check (kind in ('table', 'chair'));

alter table public.seating_tables
  add column if not exists side text not null default 'none';

alter table public.seating_tables
  drop constraint if exists seating_tables_side_check;

alter table public.seating_tables
  add constraint seating_tables_side_check
  check (side in ('left', 'right', 'none'));

alter table public.seating_tables
  add column if not exists rotation numeric(6,2) not null default 0;

alter table public.seating_tables
  drop constraint if exists seating_tables_rotation_check;

alter table public.seating_tables
  add constraint seating_tables_rotation_check
  check (rotation between 0 and 360);

alter table public.seating_tables
  add column if not exists parent_table_id uuid;

alter table public.seating_tables
  drop constraint if exists seating_tables_parent_fk;

alter table public.seating_tables
  add constraint seating_tables_parent_fk
  foreign key (parent_table_id, wedding_id)
  references public.seating_tables (id, wedding_id) on delete cascade;

alter table public.seating_events
  add column if not exists stage_x numeric(6,2) not null default 50;
alter table public.seating_events
  add column if not exists stage_y numeric(6,2) not null default 7;

alter table public.seating_events
  drop constraint if exists seating_events_stage_x_check;
alter table public.seating_events
  add constraint seating_events_stage_x_check check (stage_x between 0 and 100);
alter table public.seating_events
  drop constraint if exists seating_events_stage_y_check;
alter table public.seating_events
  add constraint seating_events_stage_y_check check (stage_y between 0 and 100);

-- Existing Akad chairs created before this migration used a one-person table
-- row. Mark them as chairs and keep their IDs/assignments intact.
update public.seating_tables
set kind = 'chair',
    side = case when canvas_x < 50 then 'left' else 'right' end
where capacity = 1
  and name ~ '^[LR][0-9]+$'
  and kind = 'table';

create index if not exists seating_tables_parent_idx
  on public.seating_tables (parent_table_id);

notify pgrst, 'reload schema';
