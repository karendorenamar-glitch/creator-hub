-- Kefoo — 040 Debt Tracker
-- Additive, isolated personal debt ledger. Run ONLY after review/approval.
-- This migration does not alter any Wedding Planner table, policy, trigger, or RPC.
-- Do not run this automatically in production; use the SQL Editor after approval.
-- Run this COMPLETE file, from begin; to commit;.

begin;

create extension if not exists pgcrypto;

create table if not exists public.debt_allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create table if not exists public.debt_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  creditor_name text not null
    check (char_length(trim(creditor_name)) between 1 and 120),
  account_type text not null default 'other'
    check (account_type in ('bank_loan', 'credit_card', 'personal_loan', 'installment', 'other')),
  reference_label text
    check (reference_label is null or char_length(reference_label) <= 120),
  original_principal numeric(14, 0) not null
    check (original_principal >= 0),
  interest_fees numeric(14, 0) not null default 0
    check (interest_fees >= 0),
  total_amount_due numeric(14, 0) not null
    check (total_amount_due >= 0),
  opening_date date not null,
  due_date date,
  status text not null default 'active'
    check (status in ('active', 'paid', 'closed')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_accounts_total_matches_components
    check (total_amount_due = original_principal + interest_fees),
  constraint debt_accounts_id_owner_unique unique (id, owner_user_id)
);

create index if not exists debt_accounts_owner_idx
  on public.debt_accounts (owner_user_id, status, due_date);

create table if not exists public.debt_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  debt_account_id uuid not null,
  due_date date not null,
  amount_due numeric(14, 0) not null check (amount_due > 0),
  status text not null default 'upcoming'
    check (status in ('upcoming', 'paid', 'cancelled')),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_schedules_id_owner_unique unique (id, owner_user_id),
  constraint debt_schedules_id_account_owner_unique
    unique (id, debt_account_id, owner_user_id),
  constraint debt_schedules_account_owner_fk
    foreign key (debt_account_id, owner_user_id)
    references public.debt_accounts (id, owner_user_id)
    on delete restrict
);

create index if not exists debt_schedules_owner_due_idx
  on public.debt_schedules (owner_user_id, status, due_date);
create index if not exists debt_schedules_account_idx
  on public.debt_schedules (debt_account_id);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  debt_account_id uuid not null,
  schedule_id uuid,
  amount numeric(14, 0) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text
    check (payment_method is null or char_length(payment_method) <= 80),
  reference text
    check (reference is null or char_length(reference) <= 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  idempotency_key text
    check (idempotency_key is null or char_length(idempotency_key) <= 120),
  reversed_at timestamptz,
  reversal_reason text
    check (reversal_reason is null or char_length(reversal_reason) <= 500),
  created_at timestamptz not null default now(),
  constraint debt_payments_id_owner_unique unique (id, owner_user_id),
  constraint debt_payments_account_owner_fk
    foreign key (debt_account_id, owner_user_id)
    references public.debt_accounts (id, owner_user_id)
    on delete restrict,
  constraint debt_payments_schedule_account_owner_fk
    foreign key (schedule_id, debt_account_id, owner_user_id)
    references public.debt_schedules (id, debt_account_id, owner_user_id)
    on delete set null (schedule_id)
);

create unique index if not exists debt_payments_idempotency_idx
  on public.debt_payments (owner_user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists debt_payments_owner_date_idx
  on public.debt_payments (owner_user_id, payment_date desc);
create index if not exists debt_payments_account_idx
  on public.debt_payments (debt_account_id, payment_date desc);
create index if not exists debt_payments_schedule_idx
  on public.debt_payments (schedule_id);

-- Debt-specific timestamp trigger. Keeping this function separate avoids a
-- dependency on the Wedding Planner migration that created set_updated_at().
create or replace function public.debt_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.debt_set_updated_at() from public, anon, authenticated;

drop trigger if exists debt_accounts_set_updated_at on public.debt_accounts;
create trigger debt_accounts_set_updated_at
  before update on public.debt_accounts
  for each row execute function public.debt_set_updated_at();

drop trigger if exists debt_schedules_set_updated_at on public.debt_schedules;
create trigger debt_schedules_set_updated_at
  before update on public.debt_schedules
  for each row execute function public.debt_set_updated_at();

-- The allowlist is server-managed. It is intentionally not readable or
-- writable by ordinary authenticated users; the SECURITY DEFINER helper below
-- is the only app-facing access path.
alter table public.debt_allowed_users enable row level security;
revoke all on public.debt_allowed_users from anon, authenticated;

create or replace function public.is_debt_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.debt_allowed_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_debt_owner() from public, anon;
grant execute on function public.is_debt_owner() to authenticated;

alter table public.debt_accounts enable row level security;
alter table public.debt_schedules enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "Debt owner reads accounts" on public.debt_accounts;
create policy "Debt owner reads accounts"
  on public.debt_accounts for select to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner inserts accounts" on public.debt_accounts;
create policy "Debt owner inserts accounts"
  on public.debt_accounts for insert to authenticated
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner updates accounts" on public.debt_accounts;
create policy "Debt owner updates accounts"
  on public.debt_accounts for update to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner())
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner deletes accounts" on public.debt_accounts;
create policy "Debt owner deletes accounts"
  on public.debt_accounts for delete to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner reads schedules" on public.debt_schedules;
create policy "Debt owner reads schedules"
  on public.debt_schedules for select to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner inserts schedules" on public.debt_schedules;
create policy "Debt owner inserts schedules"
  on public.debt_schedules for insert to authenticated
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner updates schedules" on public.debt_schedules;
create policy "Debt owner updates schedules"
  on public.debt_schedules for update to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner())
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner deletes schedules" on public.debt_schedules;
create policy "Debt owner deletes schedules"
  on public.debt_schedules for delete to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());


drop policy if exists "Debt owner reads payments" on public.debt_payments;
create policy "Debt owner reads payments"
  on public.debt_payments for select to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner inserts payments" on public.debt_payments;
create policy "Debt owner inserts payments"
  on public.debt_payments for insert to authenticated
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner updates payments" on public.debt_payments;
create policy "Debt owner updates payments"
  on public.debt_payments for update to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner())
  with check (owner_user_id = auth.uid() and public.is_debt_owner());

drop policy if exists "Debt owner deletes payments" on public.debt_payments;
create policy "Debt owner deletes payments"
  on public.debt_payments for delete to authenticated
  using (owner_user_id = auth.uid() and public.is_debt_owner());

revoke all on public.debt_accounts from anon, authenticated;
revoke all on public.debt_schedules from anon, authenticated;
revoke all on public.debt_payments from anon, authenticated;

grant select, insert, update, delete on public.debt_accounts to authenticated;
grant select, insert, update, delete on public.debt_schedules to authenticated;
grant select, insert, update, delete on public.debt_payments to authenticated;

notify pgrst, 'reload schema';

commit;

