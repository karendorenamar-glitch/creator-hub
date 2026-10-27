-- Kefoo Wedding Planner - 036: donor-funded costs.
-- Additive/non-destructive. A cost can be marked as covered by the donation
-- pool. It is treated as paid in the coverage calculation, while the donation
-- pool is reduced by the same amount.

alter table public.vendors
  add column if not exists funded_by_donor boolean not null default false;

alter table public.expenses
  add column if not exists funded_by_donor boolean not null default false;

create index if not exists vendors_funded_by_donor_idx
  on public.vendors (wedding_id) where funded_by_donor = true;

create index if not exists expenses_funded_by_donor_idx
  on public.expenses (wedding_id) where funded_by_donor = true;

notify pgrst, 'reload schema';
