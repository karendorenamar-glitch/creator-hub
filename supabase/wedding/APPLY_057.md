# Apply 057 — approve payments made before onboarding

Replaces `approve_payment`. No table or data change.

## Bug it fixes

Since migration 015 customers pay **before** creating a wedding, so
`payments.wedding_id` is `NULL`. The function required a wedding membership and
failed with:

`Payment is not linked to a wedding of this customer.`

## New behaviour

- `wedding_id IS NULL` -> membership check is skipped, and access is granted on
the account (`user_entitlements`), which is what unlocks onboarding.
- `wedding_id IS NOT NULL` -> the original membership check and the wedding
  lifetime columns are kept.
- Admin guard, row lock, status validation, idempotent early return and the 20%
  commission block are all preserved.

## Run

Supabase SQL Editor -> `supabase/wedding/057_approve_before_onboarding.sql`.

## Verify

```sql
select pg_get_functiondef('public.approve_payment(uuid)'::regprocedure)
  ilike '%user_entitlements%' as grants_account_access;
```
