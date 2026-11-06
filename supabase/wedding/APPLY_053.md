# Apply 053 — affiliate referral overview

One read-only RPC. No table, policy or payment rule changes.

Affiliates cannot read the `payments` table, so this function (security definer,
`search_path` pinned) returns only rows for the signed-in affiliate:

- customer reference (first 8 characters of the customer id)
- attribution and signup timestamps
- payment counts: total / approved / pending / rejected
- commission totals per currency

## Run

Supabase SQL Editor -> `supabase/wedding/053_affiliate_referrals_overview.sql`.

## Verify

```sql
select proname from pg_proc where proname = 'affiliate_referrals_overview';
```

## Rollback

```sql
drop function if exists public.affiliate_referrals_overview();
```
