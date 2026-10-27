-- Kefoo Wedding Planner - 031: seating arrangement, floor plan and rooms.
-- Additive/non-destructive. Guest data is preserved; no guest is auto-assigned.
-- Run after 030.

-- Required for composite FKs so a table/room can never point at another
-- wedding's guest.
create unique index if not exists guests_id_wedding_idx
  on public.guests (id, wedding_id);

-- ---------------------------------------------------------------------------
-- Seating events (Akad / Ceremony and Dinner Reception)
-- ---------------------------------------------------------------------------
create table if not exists public.seating_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  event_type text not null check (event_type in ('akad', 'dinner')),
  name text not null default 'Akad / Ceremony'
    check (char_length(trim(name)) between 1 and 80),
  event_date date,
  start_time time,
  zoom numeric(4,2) not null default 1 check (zoom between 0.5 and 2),
  pan_x numeric not null default 0,
  pan_y numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, event_type),
  unique (id, wedding_id)
);

create index if not exists seating_events_wedding_idx
  on public.seating_events (wedding_id);

-- ---------------------------------------------------------------------------
-- Tables inside an event
-- ---------------------------------------------------------------------------
create table if not exists public.seating_tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  event_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  shape text not null default 'round' check (shape in ('round', 'rect')),
  capacity integer not null default 8 check (capacity between 0 and 100),
  canvas_x numeric(6,2) not null default 50 check (canvas_x between 0 and 100),
  canvas_y numeric(6,2) not null default 50 check (canvas_y between 0 and 100),
  width numeric(6,2) not null default 12 check (width between 4 and 35),
  height numeric(6,2) not null default 12 check (height between 4 and 35),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  unique (id, event_id, wedding_id),
  foreign key (event_id, wedding_id)
    references public.seating_events (id, wedding_id) on delete cascade
);

create index if not exists seating_tables_event_idx
  on public.seating_tables (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Event-specific assignments. A guest can be assigned once per event and may
-- be assigned independently for akad and dinner.
-- ---------------------------------------------------------------------------
create table if not exists public.seating_assignments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  event_id uuid not null,
  table_id uuid not null,
  guest_id uuid not null,
  created_at timestamptz not null default now(),
  unique (event_id, guest_id),
  unique (id, wedding_id),
  foreign key (event_id, wedding_id)
    references public.seating_events (id, wedding_id) on delete cascade,
  foreign key (table_id, event_id, wedding_id)
    references public.seating_tables (id, event_id, wedding_id) on delete cascade,
  foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id) on delete cascade
);

create index if not exists seating_assignments_table_idx
  on public.seating_assignments (table_id);
create index if not exists seating_assignments_event_idx
  on public.seating_assignments (event_id);

-- ---------------------------------------------------------------------------
-- Rooms / accommodation
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  hotel_name text check (hotel_name is null or char_length(hotel_name) <= 120),
  room_type text not null default 'double'
    check (room_type in ('single', 'twin', 'double', 'suite', 'custom')),
  capacity integer not null default 2 check (capacity between 0 and 20),
  breakfast_type text not null default 'unconfigured'
    check (breakfast_type in ('none', 'included', 'custom', 'unconfigured')),
  breakfast_pax integer check (breakfast_pax is null or breakfast_pax between 0 and 20),
  breakfast_notes text check (breakfast_notes is null or char_length(breakfast_notes) <= 500),
  check_in date,
  check_out date,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  check (check_out is null or check_in is null or check_out >= check_in)
);

create index if not exists rooms_wedding_idx
  on public.rooms (wedding_id);

create unique index if not exists rooms_name_per_wedding_idx
  on public.rooms (wedding_id, lower(name));

-- ---------------------------------------------------------------------------
-- One room assignment per guest per wedding. Seating assignments are separate.
-- ---------------------------------------------------------------------------
create table if not exists public.room_assignments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  room_id uuid not null,
  guest_id uuid not null,
  created_at timestamptz not null default now(),
  unique (wedding_id, guest_id),
  unique (id, wedding_id),
  foreign key (room_id, wedding_id)
    references public.rooms (id, wedding_id) on delete cascade,
  foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id) on delete cascade
);

create index if not exists room_assignments_room_idx
  on public.room_assignments (room_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['seating_events', 'seating_tables', 'rooms']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS + grants. Reuses the same access rule as the rest of planning data.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'seating_events', 'seating_tables', 'seating_assignments', 'rooms', 'room_assignments'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I',
      'Subscribed members manage ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.wedding_has_access(wedding_id)) with check (public.wedding_has_access(wedding_id))',
      'Subscribed members manage ' || t, t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- Create the two fixed events for existing weddings. New weddings get them
-- lazily from the seating page and can still rename/configure them.
insert into public.seating_events (wedding_id, event_type, name)
select id, 'akad', 'Akad / Ceremony'
from public.weddings
on conflict (wedding_id, event_type) do nothing;

insert into public.seating_events (wedding_id, event_type, name)
select id, 'dinner', 'Dinner Reception'
from public.weddings
on conflict (wedding_id, event_type) do nothing;

notify pgrst, 'reload schema';
