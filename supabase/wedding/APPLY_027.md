# Apply migration 027 (donations + central vendor options)

Migration `027_donations_and_vendor_options.sql` is additive and must be
reviewed/applied before using Donatur Tercinta or Opsi Vendor in production.
Do **not** run it without approval.

What it adds:

- `public.wedding_donations`: donor name + positive Rupiah amount, RLS scoped
  to the wedding workspace. Donations are not vendor payments.
- `public.vendor_options`: central candidate table for Opsi Vendor with
  category, name, Instagram, reference price, love/hesitation notes, and
  `selected_vendor_id` pointing to the confirmed Budget vendor.
- a unique partial index enforcing at most one selected candidate per category;
- a unique index preventing repeated new candidates with the same normalized
  name/category (legacy rows are exempt);
- a database trigger enforcing a maximum of 5 candidates per category;
- RLS policies using `public.wedding_has_access(wedding_id)`;
- a non-destructive backfill of old `inspiration_vendor_options` rows into the
  new table. The old rows are not deleted, and `legacy_inspiration_option_id`
  keeps their origin traceable.

Before applying, verify 026 is applied (or the old vendor-name fallback is
acceptable), then run 027 manually in the Supabase SQL Editor. Verify:

```sql
select to_regclass('public.wedding_donations') is not null;
select to_regclass('public.vendor_options') is not null;

select count(*) as legacy_candidates
from public.vendor_options
where legacy_inspiration_option_id is not null;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.vendor_options'::regclass
  and conname in ('vendor_options_selected_fk', 'vendor_options_vendor_name_check');
```

Expected:

- both tables exist;
- old inspiration candidates are present in `vendor_options` (when there were
  any);
- RLS and the 5-per-category trigger are active.

Do not delete `inspiration_vendor_options`; it is intentionally retained as
legacy/source data.
