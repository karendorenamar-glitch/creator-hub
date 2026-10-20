-- Kefoo Wedding Planner - 005: vendor billing, payment history, 3-state status.
-- Run FIFTH, after 001-004. Safe to re-run. NON-DESTRUCTIVE:
-- no rows or tables are deleted, old values are mapped before new checks apply.

-- ---------------------------------------------------------------------------
-- 1. Vendor category becomes free text (no fixed list).
--    Existing values such as 'venue' remain valid strings.
-- ---------------------------------------------------------------------------
alter table public.vendors drop constraint if exists vendors_category_check;
alter table public.vendors alter column category set default '';
alter table public.vendors alter column category drop not null;

-- Vendor name is optional per the product spec (all identity fields optional).
alter table public.vendors drop constraint if exists vendors_name_check;
alter table public.vendors alter column name set default '';
alter table public.vendors alter column name drop not null;

-- ---------------------------------------------------------------------------
-- 2. Payment status: exactly three values (diskusi | dp | lunas).
--    Map legacy values BEFORE adding the new constraint.
-- ---------------------------------------------------------------------------
alter table public.vendors drop constraint if exists vendors_payment_status_check;

update public.vendors
set payment_status = case
  when payment_status = 'unpaid' then 'diskusi'
  when payment_status in ('deposit_paid', 'partially_paid') then 'dp'
  when payment_status = 'paid' then 'lunas'
  else 'diskusi'
end
where payment_status not in ('diskusi', 'dp', 'lunas');

alter table public.vendors alter column payment_status set default 'diskusi';
alter table public.vendors
  add constraint vendors_payment_status_check
  check (payment_status in ('diskusi', 'dp', 'lunas'));

alter table public.expenses drop constraint if exists expenses_payment_status_check;

update public.expenses
set payment_status = case
  when payment_status = 'unpaid' then 'diskusi'
  when payment_status in ('deposit_paid', 'partially_paid') then 'dp'
  when payment_status = 'paid' then 'lunas'
  else 'diskusi'
end
where payment_status not in ('diskusi', 'dp', 'lunas');

alter table public.expenses alter column payment_status set default 'diskusi';
alter table public.expenses
  add constraint expenses_payment_status_check
  check (payment_status in ('diskusi', 'dp', 'lunas'));

-- ---------------------------------------------------------------------------
-- 3. Internal PIC (separate from the vendor contact person).
--    Stored as a label such as "Ortu Budi" so it stays readable even if a
--    partner name changes later.
-- ---------------------------------------------------------------------------
alter table public.vendors
  add column if not exists pic_internal text
  check (pic_internal is null or char_length(pic_internal) <= 120);

-- ---------------------------------------------------------------------------
-- 4. Payment history: one row per actual payment made to a vendor.
--    This is the single source of truth for "total sudah dibayarkan".
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_id uuid not null,
  amount numeric(14,0) not null check (amount > 0),
  paid_on date not null default current_date,
  method text check (method is null or char_length(method) <= 60),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (vendor_id, wedding_id)
    references public.vendors (id, wedding_id) on delete cascade
);

create index if not exists vendor_payments_wedding_idx
  on public.vendor_payments (wedding_id, paid_on desc);
create index if not exists vendor_payments_vendor_idx
  on public.vendor_payments (vendor_id, paid_on desc);

-- Preserve existing paid amounts as one opening payment per vendor, so the
-- total paid does not change when this migration runs. Skipped on re-run.
insert into public.vendor_payments (wedding_id, vendor_id, amount, paid_on, notes)
select v.wedding_id, v.id, v.amount_paid,
       coalesce(v.booking_date, current_date),
       'Saldo awal (migrasi)'
from public.vendors v
where v.amount_paid > 0
  and not exists (
    select 1 from public.vendor_payments p where p.vendor_id = v.id
  );

-- Keep vendors.amount_paid in sync as a cached total for older screens.
create or replace function public.sync_vendor_amount_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vendor uuid;
begin
  v_vendor := coalesce(new.vendor_id, old.vendor_id);

  update public.vendors v
  set amount_paid = coalesce(
    (select sum(p.amount) from public.vendor_payments p where p.vendor_id = v_vendor),
    0
  )
  where v.id = v_vendor;

  if tg_op = 'UPDATE' and old.vendor_id <> new.vendor_id then
    update public.vendors v
    set amount_paid = coalesce(
      (select sum(p.amount) from public.vendor_payments p where p.vendor_id = old.vendor_id),
      0
    )
    where v.id = old.vendor_id;
  end if;

  return null;
end;
$$;

drop trigger if exists vendor_payments_sync on public.vendor_payments;
create trigger vendor_payments_sync
  after insert or update or delete on public.vendor_payments
  for each row execute function public.sync_vendor_amount_paid();

revoke all on function public.sync_vendor_amount_paid() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS: same rules as every other planning table.
-- ---------------------------------------------------------------------------
do $$
declare
  t text := 'vendor_payments';
begin
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists %I on public.%I',
    'Subscribed members manage ' || t, t);
  execute format(
    'create policy %I on public.%I for all to authenticated using (public.wedding_has_access(wedding_id)) with check (public.wedding_has_access(wedding_id))',
    'Subscribed members manage ' || t, t);

  execute format('revoke all on public.%I from anon, authenticated', t);
  execute format('grant select, insert, update, delete on public.%I to authenticated', t);
end;
$$;

notify pgrst, 'reload schema';

