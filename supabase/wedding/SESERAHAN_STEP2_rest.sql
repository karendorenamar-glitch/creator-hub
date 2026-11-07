-- Kefoo — seserahan step 2 of 2: bucket, storage policies, brand, categories.

begin;

insert into storage.buckets (id, name, public)
values ('seserahan-photos', 'seserahan-photos', false)
on conflict (id) do nothing;

-- Storage policies. Wrapped so an ownership error on storage.objects cannot
-- abort the whole migration; the bucket itself is created separately below.
do $$
begin
  drop policy if exists "Seserahan photos read" on storage.objects;
  create policy "Seserahan photos read" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'seserahan-photos'
      and public.wedding_has_access(((storage.foldername(name))[1])::uuid)
    );

  drop policy if exists "Seserahan photos write" on storage.objects;
  create policy "Seserahan photos write" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'seserahan-photos'
      and public.wedding_has_access(((storage.foldername(name))[1])::uuid)
    );

  drop policy if exists "Seserahan photos delete" on storage.objects;
  create policy "Seserahan photos delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'seserahan-photos'
      and public.wedding_has_access(((storage.foldername(name))[1])::uuid)
    );
exception
  when insufficient_privilege then
    raise notice 'Storage policies skipped (insufficient privilege). Create them in Dashboard > Storage > seserahan-photos > Policies.';
end $$;

notify pgrst, 'reload schema';

commit;

begin;

alter table public.seserahan_items
  add column if not exists brand text
  check (brand is null or char_length(brand) <= 80);

commit;

begin;

-- 1. Drop the previous suggestions when nothing references them.
delete from public.seserahan_categories c
where c.name in (
  'Perhiasan', 'Pakaian', 'Sepatu', 'Tas', 'Makeup', 'Al-Quran',
  'Mukena/Sarung', 'Perlengkapan Mandi', 'Aksesoris'
)
and not exists (
  select 1 from public.seserahan_items i where i.category_id = c.id
);

-- 2. Add the new suggestions for every wedding that already has a list.
insert into public.seserahan_categories (wedding_id, name, sort_order)
select w.id, v.name, v.ord
from public.weddings w
cross join (values
  ('Skincare/makeup', 0),
  ('Fashion/pakaian', 1),
  ('Tas/sepatu/aksesoris', 2),
  ('Bodycare/fragrance', 3),
  ('Ibadah', 4),
  ('Makanan', 5),
  ('Mahar', 6),
  ('Lainnya', 7)
) as v(name, ord)
where exists (
  select 1 from public.seserahan_categories c where c.wedding_id = w.id
)
on conflict do nothing;

commit;

-- Verification (should return 3 rows)
select table_name
from information_schema.tables
where table_schema = 'public' and table_name like 'seserahan%'
order by table_name;

-- Verification (brand column, should return 1 row)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'seserahan_items'
  and column_name = 'brand';
