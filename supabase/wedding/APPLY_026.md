# Apply migration 026 (optional inspiration vendor name)

Migration `026_optional_inspiration_vendor_name.sql` is additive/non-destructive.
It allows an inspiration vendor option to be created before the customer knows
the vendor name. The option remains reference-only and never enters Vendor
Budget, payments, or Target Budget.

What it changes:

- drops the old `vendor_name` length/trim constraint;
- sets the default to an empty string;
- adds a constraint that still limits the name to 120 characters.

Existing rows are untouched. Run after 025, then verify:

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.inspiration_vendor_options'::regclass
  and conname = 'inspiration_vendor_options_vendor_name_check';

select column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'inspiration_vendor_options'
  and column_name = 'vendor_name';
```

Expected:

- constraint allows an empty string and caps length at 120;
- `vendor_name` remains `NOT NULL`, default `''`.

This migration must be applied before deploying the optional-vendor-name UI.
