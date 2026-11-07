-- Kefoo — 060: align seserahan default categories with the new set.
-- Idempotent. Only removes unused leftovers from the first default list.

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
