# Apply 056 — delete test affiliates without touching money

Replaces `admin_delete_affiliate`.

## New behaviour

| Data present | Result |
|---|---|
Nothing | profile deleted |
Clicks / referrals only | those rows are deleted together with the profile |
Any commission or payout | **refused**: "has commission or payout history. Suspend it instead." |

Optional second argument `p_delete_login` (default `false`) also removes the
matching `auth.users` row, so the email can register again from scratch.

Clicks and referrals are attribution records, not money. Commissions, payouts
and ledger entries tied to money can never be deleted from the app.

## Run

Supabase SQL Editor -> `supabase/wedding/056_affiliate_delete_relaxed.sql`.

## Verify

```sql
select pg_get_functiondef('public.admin_delete_affiliate(uuid,boolean)'::regprocedure)
  ilike '%p_delete_login%' as has_login_option;
```
