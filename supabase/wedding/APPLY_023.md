# Apply migration 023 (vendor collaboration)

Migration `023_vendor_collaboration.sql` must be applied to production before this code is deployed.

> Historical note: the `collaboration_type` column added by 023 is no longer used by the product and is removed by migration 024. `collaboration_completed_at` remains.

It is additive and does not rewrite existing vendor, payment, proof, or Inspiration data:

- adds `vendors.collaboration_type` with default `paid` and allowed values
  `paid`, `endorsement`, `sponsorship`, `barter`;
- adds `vendors.collaboration_completed_at` (nullable timestamp);
- keeps `vendors.agreed_price = NULL` distinct from explicit `0`;
- does not create payment rows for completed zero-price collaborations.

The new vendor form and zero-price completion workflow require this migration.
Do not deploy the code to a database without it.

Run in the Supabase SQL Editor for the wedding project after 022, then verify:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'vendors'
  and column_name in ('collaboration_type', 'collaboration_completed_at');

select collaboration_type, count(*)
from public.vendors
group by collaboration_type;

select count(*) filter (where agreed_price is null) as missing_price,
       count(*) filter (where agreed_price = 0) as explicit_zero,
       count(*) filter (where collaboration_completed_at is not null) as completed_zero_collaborations
from public.vendors;
```

No RLS policy changes are needed.
