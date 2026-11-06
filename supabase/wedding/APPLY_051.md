# Apply 051 — Affiliate program foundation

Additive migration. Does not touch checkout, customer auth, wedding data or
existing payment rows. Balances are never stored; they are derived from an
append-only ledger.

## What it creates

| Object | Purpose |
|---|---|
| `affiliates` | one profile per auth user, unique `referral_code`, status active/suspended |
| `affiliate_clicks` | one row per referral visit, written by RPC only |
| `affiliate_referrals` | one row per customer (unique), first attribution wins |
| `affiliate_commissions` | one row per payment (unique), currency follows the payment |
| `affiliate_payouts` | one request per currency, bank details are a snapshot |
| `affiliate_ledger` | append-only source of every balance |
| `affiliate_balances(uuid)` | per-currency balances (earned/reserved/paid/available) |
| `record_affiliate_click`, `attribute_affiliate_referral` | server-side tracking |
| `affiliate_request_payout` | atomic reservation of a payout |
| `affiliate_payout_processing/paid/reject` | admin-only settlement |
| `approve_payment` | **replaced**: original body plus 20% commission creation |

## How to run

Supabase SQL Editor -> `supabase/wedding/051_affiliate_program.sql`.

Run inside a maintenance window: the migration replaces `approve_payment`.
It is backwards compatible (same signature, same authorization, same
idempotency), but an approval happening in the same second may wait on the
row lock.

## Verify

```sql
-- sanity: the six tables exist
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'affiliate%'
order by table_name;
```

```sql
-- approve_payment still has its original guards
select pg_get_functiondef('public.approve_payment(uuid)'::regprocedure)
  ilike '%Not authorized%' as has_admin_guard,
  pg_get_functiondef('public.approve_payment(uuid)'::regprocedure)
  ilike '%idempotent%' as keeps_idempotency,
  pg_get_functiondef('public.approve_payment(uuid)'::regprocedure)
  ilike '%affiliate_commissions%' as creates_commission;
```

## Rollback

```sql
-- keep the data: drop only the new objects
-- (run only if no affiliate rows exist yet)
drop function if exists public.affiliate_payout_reject(uuid, text);
drop function if exists public.affiliate_payout_paid(uuid, date, text, numeric, text);
drop function if exists public.affiliate_payout_processing(uuid);
drop function if exists public.affiliate_request_payout(text, numeric, text, text, text);
drop function if exists public.attribute_affiliate_referral(text, uuid);
drop function if exists public.record_affiliate_click(text, text, text, text);
drop function if exists public.affiliate_balances(uuid);
drop table if exists public.affiliate_ledger, public.affiliate_payouts,
  public.affiliate_commissions, public.affiliate_referrals,
  public.affiliate_clicks, public.affiliates cascade;
```

`approve_payment` should then be re-created from migration 012 to remove the
commission block.
