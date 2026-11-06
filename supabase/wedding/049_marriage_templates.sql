-- Kefoo — 049: country/state marriage checklists
-- Additive only. Existing checklists, tasks and progress are untouched.

begin;

-- 1. Malaysian customers pick the state where they apply to marry.
--    Per wedding (not per user): the same couple can plan two different
--    ceremonies with different state offices.
alter table public.weddings
  add column if not exists state_code text;

alter table public.weddings
  drop constraint if exists weddings_state_code_check;
alter table public.weddings
  add constraint weddings_state_code_check check (
    state_code is null or state_code in (
      'JHR','SGR','KUL','NSN','MLK','PRK','KDH','PLS',
      'TRG','KTN','PHG','PNG','SBH','SWK'
    )
  );

-- 2. New built-in templates reuse the existing kind column.
alter table public.checklists
  drop constraint if exists checklists_kind_check;
alter table public.checklists
  add constraint checklists_kind_check check (
    kind in ('custom', 'builtin_kua', 'builtin_my', 'builtin_generic')
  );

notify pgrst, 'reload schema';

commit;

-- Verification:
--   select column_name, data_type from information_schema.columns
--   where table_name = 'weddings' and column_name = 'state_code';
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.checklists'::regclass
--     and conname = 'checklists_kind_check';
