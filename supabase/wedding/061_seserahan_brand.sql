-- Kefoo — 061: optional brand/merka column for seserahan items.

begin;

alter table public.seserahan_items
  add column if not exists brand text
  check (brand is null or char_length(brand) <= 80);

commit;
