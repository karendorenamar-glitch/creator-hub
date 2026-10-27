-- Kefoo Wedding Planner - 027: wedding donations + central vendor options.
-- Additive and non-destructive. Run only after 026 is reviewed/applied.
--
-- Old inspiration candidates are copied into the new central table; neither
-- inspiration_vendor_options nor any inspiration photo is deleted.

-- 1. Donations (separate from vendor payments).
create table if not exists public.wedding_donations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  donor_name text not null
    check (char_length(trim(donor_name)) between 1 and 120),
  amount numeric(14,0) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);

create index if not exists wedding_donations_wedding_idx
  on public.wedding_donations (wedding_id, created_at);

drop trigger if exists wedding_donations_updated_at
  on public.wedding_donations;
create trigger wedding_donations_updated_at
  before update on public.wedding_donations
  for each row execute function public.set_updated_at();

alter table public.wedding_donations enable row level security;

drop policy if exists "Subscribed members manage wedding_donations"
  on public.wedding_donations;
create policy "Subscribed members manage wedding_donations"
  on public.wedding_donations
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.wedding_donations from anon, authenticated;
grant select, insert, update, delete
  on public.wedding_donations to authenticated;

-- 2. Central vendor options (candidates, not booked vendors).
create table if not exists public.vendor_options (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category text not null default 'Lainnya'
    check (char_length(trim(category)) between 1 and 80),
  vendor_name text not null
    check (char_length(trim(vendor_name)) between 1 and 120),
  instagram_url text
    check (instagram_url is null or
      (char_length(instagram_url) <= 1000 and instagram_url ~* '^https?://')),
  reference_price numeric(14,0)
    check (reference_price is null or reference_price >= 0),
  love_reason text
    check (love_reason is null or char_length(love_reason) <= 2000),
  hesitation text
    check (hesitation is null or char_length(hesitation) <= 2000),
  selected_vendor_id uuid,
  legacy_inspiration_option_id uuid unique
    references public.inspiration_vendor_options(id) on delete set null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (selected_vendor_id, wedding_id)
    references public.vendors (id, wedding_id)
    on delete set null (selected_vendor_id)
);

create index if not exists vendor_options_wedding_idx
  on public.vendor_options (wedding_id, category, created_at);
create index if not exists vendor_options_selected_idx
  on public.vendor_options (selected_vendor_id);

-- One selected option per category and wedding. Alternatives stay stored.
create unique index if not exists vendor_options_one_selected_idx
  on public.vendor_options (wedding_id, lower(trim(category)))
  where selected_vendor_id is not null;

-- New candidates are unique by normalized name/category. Legacy rows are
-- exempt so the backfill can preserve every old row even if it was duplicated.
create unique index if not exists vendor_options_new_name_idx
  on public.vendor_options (
    wedding_id, lower(trim(category)), lower(trim(vendor_name))
  )
  where legacy_inspiration_option_id is null;

drop trigger if exists vendor_options_updated_at
  on public.vendor_options;
create trigger vendor_options_updated_at
  before update on public.vendor_options
  for each row execute function public.set_updated_at();

-- Backfill old inspiration candidates without deleting their source rows.
insert into public.vendor_options (
  wedding_id, category, vendor_name, instagram_url, reference_price,
  legacy_inspiration_option_id, sort_order, created_at, updated_at
)
select
  o.wedding_id,
  coalesce(nullif(trim(i.category), ''), 'Lainnya'),
  coalesce(nullif(trim(o.vendor_name), ''), 'Opsi Vendor'),
  o.instagram_url,
  o.reference_price,
  o.id,
  o.sort_order,
  o.created_at,
  o.updated_at
from public.inspiration_vendor_options o
join public.inspiration_items i
  on i.id = o.item_id
 and i.wedding_id = o.wedding_id
on conflict (legacy_inspiration_option_id) do nothing;

-- Hard guard: at most five candidates per normalized category.
create or replace function public.enforce_vendor_option_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.vendor_options
    where wedding_id = new.wedding_id
      and lower(trim(category)) = lower(trim(new.category))
      and (new.id is null or id <> new.id)
  ) >= 5 then
    raise exception 'vendor_option_limit' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_vendor_option_limit()
  from public, anon, authenticated;

drop trigger if exists vendor_options_limit on public.vendor_options;
create trigger vendor_options_limit
  before insert or update of category on public.vendor_options
  for each row execute function public.enforce_vendor_option_limit();

alter table public.vendor_options enable row level security;

drop policy if exists "Subscribed members manage vendor_options"
  on public.vendor_options;
create policy "Subscribed members manage vendor_options"
  on public.vendor_options
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.vendor_options from anon, authenticated;
grant select, insert, update, delete on public.vendor_options to authenticated;

notify pgrst, 'reload schema';
