-- Kefoo Wedding Planner - 008: multiple photos per inspiration item.
-- Run EIGHTH, after 007. Safe to re-run. Non-destructive.

-- Composite key needed for the wedding-scoped foreign key below.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inspiration_items_id_wedding_key'
  ) then
    alter table public.inspiration_items
      add constraint inspiration_items_id_wedding_key unique (id, wedding_id);
  end if;
end;
$$;

create table if not exists public.inspiration_photos (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  item_id uuid not null,
  path text not null check (char_length(path) between 1 and 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (item_id, wedding_id)
    references public.inspiration_items (id, wedding_id) on delete cascade
);

create index if not exists inspiration_photos_item_idx
  on public.inspiration_photos (item_id, sort_order);
create index if not exists inspiration_photos_wedding_idx
  on public.inspiration_photos (wedding_id);

-- Existing single-file items become one-photo albums.
insert into public.inspiration_photos (wedding_id, item_id, path, sort_order)
select i.wedding_id, i.id, i.image_path, 0
from public.inspiration_items i
where i.image_path is not null
  and not exists (
    select 1 from public.inspiration_photos p where p.item_id = i.id
  );

alter table public.inspiration_photos enable row level security;

drop policy if exists "Subscribed members manage inspiration_photos"
  on public.inspiration_photos;
create policy "Subscribed members manage inspiration_photos"
  on public.inspiration_photos
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.inspiration_photos from anon, authenticated;
grant select, insert, update, delete on public.inspiration_photos to authenticated;

notify pgrst, 'reload schema';
