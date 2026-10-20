-- Kefoo Wedding Planner - 006: payment proof uploads.
-- Run SIXTH, after 001-005. Safe to re-run. Non-destructive.

-- 1. Private storage bucket for payment proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- 2. Remember which file belongs to a payment.
alter table public.vendor_payments
  add column if not exists proof_path text
  check (proof_path is null or char_length(proof_path) <= 500);

-- 3. Storage policies: path is always "<wedding_id>/<file>".
--    Members of that wedding may read, upload and delete their own proofs.
drop policy if exists "Wedding members read payment proofs" on storage.objects;
create policy "Wedding members read payment proofs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Wedding members upload payment proofs" on storage.objects;
create policy "Wedding members upload payment proofs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Wedding members delete payment proofs" on storage.objects;
create policy "Wedding members delete payment proofs" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'payment-proofs'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

notify pgrst, 'reload schema';
