-- Kefoo Wedding Planner - 024: remove the unused collaboration_type column.
-- Run TWENTY-FOURTH, after 023 AND after deploying code that no longer reads
-- collaboration_type. Destructive only for the retired type field.
--
-- The product no longer exposes a collaboration type. The zero-price completion
-- timestamp remains available for Rp0 vendors. Existing values in
-- collaboration_type are intentionally discarded by this migration.

alter table public.vendors
  drop constraint if exists vendors_collaboration_type_check;

alter table public.vendors
  drop column if exists collaboration_type;

notify pgrst, 'reload schema';
