-- Kefoo Wedding Planner - 038: link donor allocations to their source cost.
-- Additive/non-destructive. Manual allocations keep null source columns.
-- This lets a vendor/other-cost marked "From donations" create one idempotent
-- allocation for the donor instead of looking unallocated.

alter table public.donation_allocations
  add column if not exists expense_id uuid;

alter table public.donation_allocations
  add column if not exists vendor_id uuid;

-- Composite foreign keys below require a unique target key.
create unique index if not exists expenses_id_wedding_idx
  on public.expenses (id, wedding_id);

alter table public.donation_allocations
  drop constraint if exists donation_allocations_one_source_check;
alter table public.donation_allocations
  add constraint donation_allocations_one_source_check
  check (num_nonnulls(expense_id, vendor_id) <= 1);

alter table public.donation_allocations
  drop constraint if exists donation_allocations_expense_fk;
alter table public.donation_allocations
  add constraint donation_allocations_expense_fk
  foreign key (expense_id, wedding_id)
  references public.expenses (id, wedding_id) on delete cascade;

alter table public.donation_allocations
  drop constraint if exists donation_allocations_vendor_fk;
alter table public.donation_allocations
  add constraint donation_allocations_vendor_fk
  foreign key (vendor_id, wedding_id)
  references public.vendors (id, wedding_id) on delete cascade;

create unique index if not exists donation_allocations_expense_source_idx
  on public.donation_allocations (expense_id, wedding_id)
  where expense_id is not null;

create unique index if not exists donation_allocations_vendor_source_idx
  on public.donation_allocations (vendor_id, wedding_id)
  where vendor_id is not null;

-- Backfill existing donor-funded costs when there is exactly one donor.
-- Skip anything that would exceed the donation amount or is already linked.
do $$
declare
  r record;
  v_donation_id uuid;
  v_donation_amount numeric;
  v_allocated numeric;
begin
  for r in
    select e.id, e.wedding_id, e.name, e.amount
    from public.expenses e
    where e.funded_by_donor = true
      and e.vendor_id is null
      and e.amount > 0
      and not exists (
        select 1 from public.donation_allocations a
        where a.expense_id = e.id and a.wedding_id = e.wedding_id
      )
    order by e.created_at asc
  loop
    select d.id, d.amount into v_donation_id, v_donation_amount
    from public.wedding_donations d
    where d.wedding_id = r.wedding_id
    order by d.created_at asc
    limit 1;

    if v_donation_id is null then continue; end if;
    if (select count(*) from public.wedding_donations d where d.wedding_id = r.wedding_id) <> 1 then
      continue;
    end if;

    select coalesce(sum(a.amount), 0) into v_allocated
    from public.donation_allocations a
    where a.donation_id = v_donation_id and a.wedding_id = r.wedding_id;

    if v_allocated + r.amount <= v_donation_amount then
      insert into public.donation_allocations
        (wedding_id, donation_id, expense_id, label, amount)
      values
        (r.wedding_id, v_donation_id, r.id, r.name, r.amount);
    end if;
  end loop;

  for r in
    select v.id, v.wedding_id, v.name, v.agreed_price as amount
    from public.vendors v
    where v.funded_by_donor = true
      and v.agreed_price is not null
      and v.agreed_price > 0
      and not exists (
        select 1 from public.donation_allocations a
        where a.vendor_id = v.id and a.wedding_id = v.wedding_id
      )
    order by v.created_at asc
  loop
    select d.id, d.amount into v_donation_id, v_donation_amount
    from public.wedding_donations d
    where d.wedding_id = r.wedding_id
    order by d.created_at asc
    limit 1;

    if v_donation_id is null then continue; end if;
    if (select count(*) from public.wedding_donations d where d.wedding_id = r.wedding_id) <> 1 then
      continue;
    end if;

    select coalesce(sum(a.amount), 0) into v_allocated
    from public.donation_allocations a
    where a.donation_id = v_donation_id and a.wedding_id = r.wedding_id;

    if v_allocated + r.amount <= v_donation_amount then
      insert into public.donation_allocations
        (wedding_id, donation_id, vendor_id, label, amount)
      values
        (r.wedding_id, v_donation_id, r.id, r.name, r.amount);
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
