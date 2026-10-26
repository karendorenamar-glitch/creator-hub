-- Kefoo Wedding Planner - 021: multiple vendor options per inspiration item.
-- Run TWENTY-FIRST, after 020. Additive and non-destructive. No data backfill.
--
-- Prerequisites:
--   * public.inspiration_items from 002, plus unique (id, wedding_id) from 008
--   * public.set_updated_at() from 001
--   * public.wedding_has_access(uuid) from 001/004/017
--
-- These options are research/reference data only. They have no foreign key to
-- public.vendors or public.vendor_payments and never create vendors/payments.

create table if not exists public.inspiration_vendor_options (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  item_id uuid not null,
  vendor_name text not null
    check (char_length(trim(vendor_name)) between 1 and 120),
  instagram_url text
    check (instagram_url is null or
      (char_length(instagram_url) <= 1000 and instagram_url ~* '^https?://')),
  reference_price numeric(14,0)
    check (reference_price is null or reference_price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (item_id, wedding_id)
    references public.inspiration_items (id, wedding_id) on delete cascade
);

create index if not exists inspiration_vendor_options_item_idx
  on public.inspiration_vendor_options (item_id, sort_order);
create index if not exists inspiration_vendor_options_wedding_idx
  on public.inspiration_vendor_options (wedding_id);

drop trigger if exists inspiration_vendor_options_updated_at
  on public.inspiration_vendor_options;
create trigger inspiration_vendor_options_updated_at
  before update on public.inspiration_vendor_options
  for each row execute function public.set_updated_at();

alter table public.inspiration_vendor_options enable row level security;

drop policy if exists "Subscribed members manage inspiration_vendor_options"
  on public.inspiration_vendor_options;
create policy "Subscribed members manage inspiration_vendor_options"
  on public.inspiration_vendor_options
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.inspiration_vendor_options from anon, authenticated;
grant select, insert, update, delete
  on public.inspiration_vendor_options to authenticated;

notify pgrst, 'reload schema';
