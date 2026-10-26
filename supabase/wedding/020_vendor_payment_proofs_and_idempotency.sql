-- Kefoo Wedding Planner - 020: multiple payment proof files + idempotency.
-- Run TWENTIETH, after 019. Additive and non-destructive. No data backfill.
--
-- Prerequisites:
--   * public.vendor_payments from 005, including unique (id, wedding_id)
--   * public.wedding_has_access(uuid) from 001/004/017
--   * public.weddings from 001
--
-- Existing vendor_payments.proof_path rows are NOT touched. New payments may
-- store multiple files in vendor_payment_proofs while legacy rows continue to
-- use proof_path as a fallback.

-- ---------------------------------------------------------------------------
-- 1. One payment transaction -> many proof files.
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  payment_id uuid not null,
  path text not null check (char_length(path) between 1 and 500),
  mime_type text not null
    check (mime_type in ('image/png', 'image/jpeg', 'application/pdf')),
  original_name text
    check (original_name is null or char_length(original_name) <= 255),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (payment_id, wedding_id)
    references public.vendor_payments (id, wedding_id) on delete cascade
);

create index if not exists vendor_payment_proofs_payment_idx
  on public.vendor_payment_proofs (payment_id, sort_order);
create index if not exists vendor_payment_proofs_wedding_idx
  on public.vendor_payment_proofs (wedding_id);

alter table public.vendor_payment_proofs enable row level security;

drop policy if exists "Subscribed members manage vendor_payment_proofs"
  on public.vendor_payment_proofs;
create policy "Subscribed members manage vendor_payment_proofs"
  on public.vendor_payment_proofs
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.vendor_payment_proofs from anon, authenticated;
grant select, insert, update, delete
  on public.vendor_payment_proofs to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Idempotency for payment creation (double-click / retry protection).
--    Existing rows keep NULL; the partial unique index allows many NULLs.
-- ---------------------------------------------------------------------------
alter table public.vendor_payments
  add column if not exists idempotency_key uuid;

create unique index if not exists vendor_payments_idempotency_idx
  on public.vendor_payments (wedding_id, idempotency_key)
  where idempotency_key is not null;

notify pgrst, 'reload schema';
