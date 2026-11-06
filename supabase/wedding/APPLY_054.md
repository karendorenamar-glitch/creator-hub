# Apply 054 — affiliate profile reclaim

Replaces one function. No schema, policy or data change.

## Why

`affiliates.user_id` is `ON DELETE SET NULL`, so deleting an auth account keeps
the affiliate history (clicks, referrals, commissions, payouts) but leaves the
row unlinked. Before this migration that affiliate could re-register and end up
with a second row and a new referral code.

## Behaviour after applying

1. Signed-in account already linked -> `Already an affiliate.`
2. An unlinked row exists with the same email -> that row is claimed, the name is
   refreshed, a suspended status is preserved, and **the old referral code is
   returned**.
3. Otherwise a new row and code are created, exactly as before.

## Run

Supabase SQL Editor -> `supabase/wedding/054_affiliate_reclaim.sql`.

## Verify

```sql
select pg_get_functiondef('public.register_affiliate(text,text)'::regprocedure)
  ilike '%user_id is null%' as claims_orphan;
```

## Rollback

Re-run `supabase/wedding/052_affiliate_registration.sql` to restore the previous
body. Claimed rows stay linked; nothing is deleted.
