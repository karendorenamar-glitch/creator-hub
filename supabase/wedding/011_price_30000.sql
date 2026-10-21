-- Kefoo Wedding Planner - 011: harga langganan menjadi Rp30.000.
-- Run ELEVENTH, after 010. Aman dijalankan berulang, tidak menghapus data.

alter table public.subscriptions drop constraint if exists subscriptions_price_idr_check;

update public.subscriptions
set price_idr = 30000
where price_idr <> 30000;

alter table public.subscriptions alter column price_idr set default 30000;

alter table public.subscriptions
  add constraint subscriptions_price_idr_check
  check (price_idr = 30000);

notify pgrst, 'reload schema';
