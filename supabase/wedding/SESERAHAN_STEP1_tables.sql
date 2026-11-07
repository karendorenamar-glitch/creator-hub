-- Kefoo — seserahan setup, ONE-SHOT and idempotent (059 + 061 + 060).
-- Run this whole file in the Supabase SQL Editor of project
-- zvetfrrwkbzkklouwqnr. Safe to re-run.

begin;

create table if not exists public.seserahan_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seserahan_categories_name_unique
  on public.seserahan_categories (wedding_id, lower(trim(name)));

create table if not exists public.seserahan_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  party text not null check (party in ('groom', 'bride')),
  name text not null check (char_length(trim(name)) between 1 and 120),
  category_id uuid references public.seserahan_categories(id) on delete set null,
  price numeric(14, 0) not null default 0 check (price >= 0),
  quantity integer not null default 1 check (quantity between 1 and 999),
  status text not null default 'not_purchased'
    check (status in ('not_purchased', 'purchased')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seserahan_items_wedding_idx
  on public.seserahan_items (wedding_id, party, created_at);

create table if not exists public.seserahan_photos (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  item_id uuid not null references public.seserahan_items(id) on delete cascade,
  path text not null check (char_length(path) <= 500),
  mime_type text,
  original_name text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists seserahan_photos_item_idx
  on public.seserahan_photos (item_id, sort_order);

-- updated_at triggers reuse the existing helper
drop trigger if exists seserahan_categories_updated_at on public.seserahan_categories;
create trigger seserahan_categories_updated_at before update on public.seserahan_categories
  for each row execute function public.set_updated_at();

drop trigger if exists seserahan_items_updated_at on public.seserahan_items;
create trigger seserahan_items_updated_at before update on public.seserahan_items
  for each row execute function public.set_updated_at();

-- RLS: wedding members only
alter table public.seserahan_categories enable row level security;
alter table public.seserahan_items enable row level security;
alter table public.seserahan_photos enable row level security;

drop policy if exists "Members manage seserahan categories" on public.seserahan_categories;
create policy "Members manage seserahan categories" on public.seserahan_categories
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

drop policy if exists "Members manage seserahan items" on public.seserahan_items;
create policy "Members manage seserahan items" on public.seserahan_items
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

drop policy if exists "Members manage seserahan photos" on public.seserahan_photos;
create policy "Members manage seserahan photos" on public.seserahan_photos
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

grant select, insert, update, delete on public.seserahan_categories to authenticated;
grant select, insert, update, delete on public.seserahan_items to authenticated;
grant select, insert, update, delete on public.seserahan_photos to authenticated;
revoke all on public.seserahan_categories, public.seserahan_items, public.seserahan_photos from anon;

-- Storage: private bucket, path <weddingId>/<itemId>/<file>

select table_name
from information_schema.tables
where table_schema = 'public' and table_name like 'seserahan%'
order by table_name;
