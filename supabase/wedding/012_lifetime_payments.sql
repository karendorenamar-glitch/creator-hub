-- Kefoo Wedding Planner - 012: one-time Rp30.000 lifetime access + manual bank-transfer receipts.
-- Run TWELFTH, after 011. Additive & non-destructive.

-- Bank transfer (BCA) manual verification. No QRIS, no gateway.
-- 1. Lifetime access flag on the wedding (source of truth for paid access).
alter table public.weddings
  add column if not exists lifetime_access_granted_at timestamptz,
  add column if not exists lifetime_access_payment_id uuid;

-- 2. Admins are explicit, not guessed from email strings in code.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.admins enable row level security;
drop policy if exists "Admins read admins" on public.admins;
create policy "Admins read admins" on public.admins
  for select to authenticated using (public.is_admin());

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- 3. Payments (one row per submission). Status flow:
--    awaiting_payment -> pending_review -> approved | rejected -> (new row on retry)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('WPP-' || upper(encode(gen_random_bytes(5), 'hex'))),
  user_id uuid not null references auth.users(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete restrict,
  amount_idr integer not null default 30000 check (amount_idr = 30000),
  currency text not null default 'IDR' check (currency = 'IDR'),
  method text not null default 'bank_transfer' check (method = 'bank_transfer'),
  status text not null default 'pending_review'
    check (status in ('awaiting_payment', 'pending_review', 'approved', 'rejected')),
  sender_name text not null check (char_length(trim(sender_name)) between 1 and 120),
  receipt_path text check (receipt_path is null or char_length(receipt_path) <= 500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed')),
  email_attempts integer not null default 0 check (email_attempts >= 0),
  email_last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one open/approved payment per user; rejected ones do not block a retry.
create unique index if not exists payments_one_open_per_user_idx
  on public.payments (user_id)
  where status in ('awaiting_payment', 'pending_review', 'approved');

create index if not exists payments_status_idx on public.payments (status, submitted_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'weddings_lifetime_payment_fk'
  ) then
    alter table public.weddings
      add constraint weddings_lifetime_payment_fk
      foreign key (lifetime_access_payment_id)
      references public.payments(id) on delete set null;
  end if;
end;
$$;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Customers read own payments" on public.payments;
create policy "Customers read own payments" on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers submit own payment" on public.payments;
create policy "Customers submit own payment" on public.payments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and amount_idr = 30000
    and status = 'pending_review'
    and receipt_path is not null
    and char_length(trim(sender_name)) between 1 and 120
    and exists (
      select 1 from public.wedding_members m
      where m.wedding_id = payments.wedding_id
        and m.user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE policy: status can only change through the functions below
-- or the service role. Customers cannot approve themselves.
-- 4. Atomic admin decisions. Only admins can call these; a customer can never
--    approve themselves, and repeated calls cannot double-grant access.
create or replace function public.approve_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select * into v_payment from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found.';
  end if;
  if v_payment.status = 'approved' then
    return; -- idempotent
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Only payments pending review can be approved.';
  end if;

  if not exists (
    select 1 from public.wedding_members m
    where m.wedding_id = v_payment.wedding_id
      and m.user_id = v_payment.user_id
  ) then
    raise exception 'Payment is not linked to a wedding of this customer.';
  end if;

  update public.payments
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(),
      rejection_reason = null
  where id = p_payment_id;

  if v_payment.wedding_id is not null then
    update public.weddings
    set lifetime_access_granted_at = coalesce(lifetime_access_granted_at, now()),
        lifetime_access_payment_id = p_payment_id
    where id = v_payment.wedding_id;
  end if;
end;
$$;

create or replace function public.reject_payment(p_payment_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  perform 1 from public.payments
  where id = p_payment_id and status = 'pending_review'
  for update;

  update public.payments
  set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(),
      rejection_reason = nullif(left(coalesce(p_reason, ''), 500), '')
  where id = p_payment_id and status = 'pending_review';

  if not found then
    raise exception 'Only payments pending review can be rejected.';
  end if;
end;
$$;

revoke all on function public.approve_payment(uuid) from public, anon;
revoke all on function public.reject_payment(uuid, text) from public, anon;
grant execute on function public.approve_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;

-- 5. Paid access = wedding member AND (lifetime granted OR active subscription
--    OR the temporary open-access switch from migration 004 is on).
create or replace function public.wedding_has_access(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_wedding_member(p_wedding_id)
     and (
       not public.requires_subscription()
       or public.has_active_subscription(p_wedding_id)
       or exists (
         select 1 from public.weddings w
         where w.id = p_wedding_id
           and w.lifetime_access_granted_at is not null
       )
     );
$$;

revoke all on function public.wedding_has_access(uuid) from public, anon;
grant execute on function public.wedding_has_access(uuid) to authenticated;

-- 6. Private receipt storage: <user_id>/<file>. Customers see only their own
--    folder; admins may read for review.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Customers upload own receipt" on storage.objects;
create policy "Customers upload own receipt" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Customers read own receipt" on storage.objects;
create policy "Customers read own receipt" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

notify pgrst, 'reload schema';

