-- Kefoo Wedding Planner - 037: allocate donations to budget needs.
-- Additive/non-destructive. A donation can fund several needs, and a need can
-- receive allocations from several donors. Allocations are earmarks, not cash
-- payments, so the budget payment calculations are not changed.

create table if not exists public.donation_allocations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  donation_id uuid not null,
  category_id uuid,
  label text not null
    check (char_length(trim(label)) between 1 and 120),
  amount numeric(14,0) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (donation_id, wedding_id)
    references public.wedding_donations (id, wedding_id) on delete cascade,
  foreign key (category_id, wedding_id)
    references public.budget_categories (id, wedding_id)
    on delete set null (category_id)
);

create index if not exists donation_allocations_donation_idx
  on public.donation_allocations (donation_id, created_at);

create index if not exists donation_allocations_wedding_idx
  on public.donation_allocations (wedding_id);

create index if not exists donation_allocations_category_idx
  on public.donation_allocations (category_id);

drop trigger if exists donation_allocations_updated_at
  on public.donation_allocations;
create trigger donation_allocations_updated_at
  before update on public.donation_allocations
  for each row execute function public.set_updated_at();

-- Never allow allocations to exceed the donor's recorded amount.
create or replace function public.validate_donation_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation_amount numeric;
  v_allocated numeric;
begin
  select amount into v_donation_amount
  from public.wedding_donations
  where id = new.donation_id and wedding_id = new.wedding_id;

  if not found then
    raise exception 'Donation not found.';
  end if;

  select coalesce(sum(amount), 0) into v_allocated
  from public.donation_allocations
  where donation_id = new.donation_id
    and wedding_id = new.wedding_id
    and id <> new.id;

  if v_allocated + new.amount > v_donation_amount then
    raise exception 'Allocation exceeds the donation amount.';
  end if;

  return new;
end;
$$;

drop trigger if exists donation_allocations_validate on public.donation_allocations;
create trigger donation_allocations_validate
  before insert or update on public.donation_allocations
  for each row execute function public.validate_donation_allocation();

-- Editing a donation amount cannot leave existing allocations over budget.
create or replace function public.validate_donation_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allocated numeric;
begin
  if new.amount = old.amount then
    return new;
  end if;

  select coalesce(sum(amount), 0) into v_allocated
  from public.donation_allocations
  where donation_id = new.id and wedding_id = new.wedding_id;

  if v_allocated > new.amount then
    raise exception 'Donation amount cannot be lower than its allocated total.';
  end if;

  return new;
end;
$$;

drop trigger if exists wedding_donations_validate_amount
  on public.wedding_donations;
create trigger wedding_donations_validate_amount
  before update of amount on public.wedding_donations
  for each row execute function public.validate_donation_amount();

alter table public.donation_allocations enable row level security;

drop policy if exists "Subscribed members manage donation_allocations"
  on public.donation_allocations;
create policy "Subscribed members manage donation_allocations"
  on public.donation_allocations
  for all to authenticated
  using (public.wedding_has_access(wedding_id))
  with check (public.wedding_has_access(wedding_id));

revoke all on public.donation_allocations from anon, authenticated;
grant select, insert, update, delete
  on public.donation_allocations to authenticated;

notify pgrst, 'reload schema';
