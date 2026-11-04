-- Kefoo — 048: allow the budget allocation module in financial_entries
-- Additive only. No amount column is rewritten; the IDR base stays the source
-- of truth and this migration only widens one CHECK constraint.
--
-- Requires 047 (public.financial_entries). Safe to run twice.

begin;

-- 1. Remove the existing module CHECK (047 created it inline, so Postgres
--    named it financial_entries_module_check). The loop also covers a renamed
--    or hand-edited constraint.
do $$
declare
  c record;
begin
  if to_regclass('public.financial_entries') is null then
    return;
  end if;

  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%module%'
  loop
    execute format(
      'alter table public.financial_entries drop constraint %I',
      c.conname
    );
  end loop;
end $$;

-- 2. Re-add it with 'allocation' included. Named explicitly so future
--    migrations can target it deterministically.
do $$
begin
  if to_regclass('public.financial_entries') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and conname = 'financial_entries_module_check'
  ) then
    alter table public.financial_entries
      add constraint financial_entries_module_check check (module in (
        'wedding_budget',
        'budget_category',
        'vendor',
        'vendor_option',
        'vendor_payment',
        'expense',
        'other_cost',
        'donation',
        'allocation'
      ));
  end if;
end $$;

notify pgrst, 'reload schema';

commit;

-- Verification (run manually):
--   select pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.financial_entries'::regclass
--     and conname = 'financial_entries_module_check';
-- Expected: CHECK ((module = ANY (ARRAY[..., 'allocation'])))
