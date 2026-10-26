-- Kefoo Wedding Planner - 023: collaboration type + explicit zero-price completion.
-- Run TWENTY-THIRD, after 022. Additive and non-destructive. No data backfill.
--
-- Existing vendors default to 'paid'. A NULL/unknown agreed_price remains
-- distinct from an explicit agreed_price = 0. Zero-price endorsement,
-- sponsorship, or barter collaborations may be explicitly completed without
-- creating a fake cash payment.

alter table public.vendors
  add column if not exists collaboration_type text not null default 'paid';

alter table public.vendors
  drop constraint if exists vendors_collaboration_type_check;
alter table public.vendors
  add constraint vendors_collaboration_type_check
  check (collaboration_type in ('paid', 'endorsement', 'sponsorship', 'barter'));

alter table public.vendors
  add column if not exists collaboration_completed_at timestamptz;

notify pgrst, 'reload schema';
