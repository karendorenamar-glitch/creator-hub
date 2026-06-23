-- Plan payment submissions (manual bank transfer + proof upload).
-- Run in the Supabase SQL Editor.

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('starter', 'growth', 'scale')),
  amount_idr integer not null check (amount_idr > 0),
  payment_date date not null,
  sender_name text,
  notes text,
  proof_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists payment_submissions_org_id_idx
  on public.payment_submissions (org_id);

create index if not exists payment_submissions_status_idx
  on public.payment_submissions (status);

alter table public.payment_submissions enable row level security;

drop policy if exists "Org members can read payment submissions" on public.payment_submissions;
create policy "Org members can read payment submissions"
  on public.payment_submissions for select
  using (public.is_org_member(org_id));

drop policy if exists "Org members can insert payment submissions" on public.payment_submissions;
create policy "Org members can insert payment submissions"
  on public.payment_submissions for insert
  with check (public.is_org_member(org_id));

-- Storage bucket for payment proof files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public read on payment proof files" on storage.objects;
create policy "Allow public read on payment proof files"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

drop policy if exists "Authenticated users can upload payment proofs" on storage.objects;
create policy "Authenticated users can upload payment proofs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'payment-proofs');

drop policy if exists "Authenticated users can update payment proofs" on storage.objects;
create policy "Authenticated users can update payment proofs"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'payment-proofs')
  with check (bucket_id = 'payment-proofs');

-- Manual approval example (run after verifying payment):
-- update public.payment_submissions
-- set status = 'approved', reviewed_at = now()
-- where id = '<submission_id>';
--
-- update public.organizations
-- set plan = 'growth', trial_ends_at = null
-- where id = '<org_id>';
