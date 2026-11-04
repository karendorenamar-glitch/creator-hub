-- Kefoo — 047: original currency entered for each financial record
-- Additive only. Existing amount columns remain the IDR base and are untouched.

begin;

-- One audit row per financial record. Existing rows simply have no row here,
-- which means "entered in IDR" (the documented storage convention).
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in (
    'wedding_budget', 'budget_category', 'vendor', 'vendor_option',
    'vendor_payment', 'expense', 'other_cost', 'donation'
  )),
  record_id uuid not null,
  entered_amount numeric(18, 4) not null check (entered_amount >= 0),
  entered_currency text not null
    check (entered_currency in ('IDR','USD','MYR','SGD','AUD','GBP','EUR','JPY')),
  fx_rate numeric(18, 10) not null check (fx_rate > 0),
  fx_rate_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_entries_record_unique unique (module, record_id)
);

drop trigger if exists financial_entries_updated_at on public.financial_entries;
create trigger financial_entries_updated_at before update on public.financial_entries
  for each row execute function public.set_updated_at();

alter table public.financial_entries enable row level security;

drop policy if exists "Customers read own financial entries" on public.financial_entries;
create policy "Customers read own financial entries" on public.financial_entries
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers insert own financial entries" on public.financial_entries;
create policy "Customers insert own financial entries" on public.financial_entries
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Customers update own financial entries" on public.financial_entries;
create policy "Customers update own financial entries" on public.financial_entries
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Customers delete own financial entries" on public.financial_entries;
create policy "Customers delete own financial entries" on public.financial_entries
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.financial_entries to authenticated;
revoke all on public.financial_entries from anon;

notify pgrst, 'reload schema';

commit;
