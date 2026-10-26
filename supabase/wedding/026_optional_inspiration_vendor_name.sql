-- Kefoo Wedding Planner - 026: allow an incomplete inspiration vendor option.
-- Additive/non-destructive: existing vendor option rows are untouched.
--
-- An option may be created before the customer knows the vendor name. It stays
-- reference-only and never enters Vendor Budget or payments.

alter table public.inspiration_vendor_options
  drop constraint if exists inspiration_vendor_options_vendor_name_check;

alter table public.inspiration_vendor_options
  alter column vendor_name set default '';

alter table public.inspiration_vendor_options
  add constraint inspiration_vendor_options_vendor_name_check
  check (vendor_name is not null and char_length(vendor_name) <= 120);

notify pgrst, 'reload schema';
