-- Kefoo — 041 Debt Tracker installments
-- Additive columns for recurring monthly due dates and tenor status.
-- Does not alter or delete existing debt records.
-- Review and run manually after 040.

begin;

alter table public.debt_accounts
  add column if not exists installment_month integer not null default 0
    check (installment_month >= 0);

alter table public.debt_accounts
  add column if not exists installment_total_months integer not null default 0
    check (installment_total_months >= 0);

alter table public.debt_accounts
  add column if not exists due_day smallint
    check (due_day is null or due_day between 1 and 31);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'debt_accounts_installment_range'
  ) then
    alter table public.debt_accounts
      add constraint debt_accounts_installment_range
      check (
        (installment_total_months = 0 and installment_month = 0)
        or (
          installment_total_months > 0
          and installment_month between 0 and installment_total_months
        )
      );
  end if;
end;
$$;

-- Existing accounts keep their current due date and get the matching day.
update public.debt_accounts
set due_day = extract(day from due_date)::smallint
where due_day is null and due_date is not null;

notify pgrst, 'reload schema';

commit;
