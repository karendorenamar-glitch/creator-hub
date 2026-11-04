-- Kefoo — 046: dashboard display currency preference
-- Additive. Does not touch payments, entitlements, weddings or balances.

begin;

create table if not exists public.customer_currency_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_currency text not null
    check (display_currency in ('IDR', 'USD', 'MYR', 'SGD', 'AUD', 'GBP', 'EUR', 'JPY')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_currency_preferences_updated_at
  on public.customer_currency_preferences;
create trigger customer_currency_preferences_updated_at
  before update on public.customer_currency_preferences
  for each row execute function public.set_updated_at();

alter table public.customer_currency_preferences enable row level security;

drop policy if exists "Customers read own currency" on public.customer_currency_preferences;
create policy "Customers read own currency" on public.customer_currency_preferences
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Customers insert own currency" on public.customer_currency_preferences;
create policy "Customers insert own currency" on public.customer_currency_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Customers update own currency" on public.customer_currency_preferences;
create policy "Customers update own currency" on public.customer_currency_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.customer_currency_preferences to authenticated;
revoke all on public.customer_currency_preferences from anon;

notify pgrst, 'reload schema';

commit;
