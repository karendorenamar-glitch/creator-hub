-- Kefoo — 050: partner nationality for conditional marriage checklists
-- Additive only. NULL means "not provided yet", not Malaysian and not foreign.

begin;

alter table public.weddings
  add column if not exists partner_nationality text;

alter table public.weddings
  drop constraint if exists weddings_partner_nationality_check;
alter table public.weddings
  add constraint weddings_partner_nationality_check check (
    partner_nationality is null
    or partner_nationality in ('MY','ID','SG','US','GB','AU')
  );

notify pgrst, 'reload schema';

commit;

-- Verification:
--   select column_name, data_type from information_schema.columns
--   where table_name = 'weddings' and column_name = 'partner_nationality';
