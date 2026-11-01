# Private Debt Tracker

This module is a private personal ledger inside the existing Kefoo project. It
shares the same Next.js, Vercel, and Supabase project as the Wedding Planner but
does not share Wedding Planner tables or routes.

## Routes

| Route | Purpose |
| --- | --- |
| `/debt/login` | Dedicated login; no public signup |
| `/debt` | Dashboard and repayment summary |
| `/debt/accounts` | Account CRUD, search, status and due-date filters |
| `/debt/payments` | Payment entry and transaction history |
| `/debt/schedule` | Upcoming and overdue installments |

All private routes are guarded on the server by `requireDebtOwner()` in the
private layout, and every Server Action calls `getDebtOwner()` again before
reading or mutating data. Middleware only refreshes the Supabase session and
redirects visitors who are not signed in.

## Database

Create a new migration from:

```text
supabase/wedding/040_debt_tracker.sql
```

The migration is additive. It creates:

- `debt_allowed_users`
- `debt_accounts`
- `debt_schedules`
- `debt_payments`
- `public.is_debt_owner()`

It does not modify any existing Wedding Planner table, policy, trigger, RPC, or
migration. **Do not run it automatically against production.** Review it and
run it manually in the Supabase SQL Editor after approval.

## Owner bootstrap

Only an existing Supabase Auth user can be authorized. There is no automatic
first-login enrollment and no public Debt Tracker signup.

1. Confirm the correct Supabase project in the dashboard.
2. Find the owner's existing Auth user:

```sql
select id, email, email_confirmed_at
from auth.users
where lower(email) = lower('owner@example.com');
```

3. Verify the returned UUID belongs to the owner. Then insert it:

```sql
insert into public.debt_allowed_users (user_id, note)
values ('AUTH_USER_UUID', 'owner bootstrap')
on conflict (user_id) do nothing;
```

4. Confirm:

```sql
select user_id, note, created_at
from public.debt_allowed_users;
```

5. Open `/debt/login` and sign in with that existing account.

To revoke access:

```sql
delete from public.debt_allowed_users
where user_id = 'AUTH_USER_UUID';
```

The allowlist has no policy or grant for `anon` or `authenticated`. It is
readable only through the `SECURITY DEFINER` helper and manageable through the
SQL Editor/admin process. Never expose the service-role key to the browser.

## Authorization

- RLS is enabled on all four tables.
- Every debt table policy requires:

```sql
owner_user_id = auth.uid() and public.is_debt_owner()
```

- Composite foreign keys tie schedules and payments to an account owned by the
  same user.
- `debt_payments.schedule_id` is optional and composite-constrained to the same
  account and owner.
- `is_debt_owner()` uses `set search_path = ''`, is revocable from `anon`, and
  is granted only to `authenticated`.
- `debt_allowed_users` has no ordinary user read/write access.

## Balance semantics

- Every payment is an individual row.
- `total_paid` is the sum of payments where `reversed_at is null`.
- `remaining = max(0, total_amount_due - total_paid)`.
- Principal and interest/fees remain visible separately.
- A full payment can set the account status to `paid`; a reversal recalculates
  it back to `active` when needed.
- Payment history is never silently deleted. Reversal sets `reversed_at` and
  `reversal_reason`, and the row remains visible.
- A schedule becomes `paid` only when a payment explicitly linked to that
  schedule covers its amount. An unrelated payment never changes a schedule.
- Accounts with payment/schedule history are closed rather than hard-deleted.
- The monthly target is the sum of upcoming schedules due in the current
  business month.

## Privacy and SEO

- `/debt/*` is excluded in `app/robots.ts`.
- The debt layout and login page set `robots: noindex, nofollow, nocache`.
- No debt data is placed in URLs; searches and filters are client-side on
  server-fetched owner-only data.
- Debt data is not written to analytics or error logs.

## Required environment variables

Only the existing public Supabase values are used:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No service-role key is required by the Debt Tracker application code.

## Manual verification after migration

The migration is intentionally not applied by this implementation. After
approval and migration:

1. Bootstrap the owner UUID.
2. Test owner login at `/debt/login`.
3. Test unauthenticated redirects for all private routes.
4. Use a second authenticated Supabase user without an allowlist row and verify
   that REST access to all four tables is denied.
5. Verify the second user cannot insert into `debt_allowed_users`.
6. Test partial payment, full payment, reversal, overdue schedules, and the
   seven-day window.
7. Smoke-test the existing `/wedding`, `/checkout`, and `/admin` routes.

## Implementation verification (before migration)

- `npx tsc --noEmit` — pass.
- `npx eslint app/debt components/debt lib/debt middleware.ts app/robots.ts tests/debt-ledger.test.mjs` — pass.
- `npm run build` — pass; all five debt routes were built dynamically.
- `node --experimental-strip-types --test tests/*.test.mjs` — 10 suites pass,
  including 28 Debt Tracker calculation and formatting checks.
- Unauthenticated smoke tests:
  - `/debt`, `/debt/accounts`, `/debt/payments`, `/debt/schedule` redirect
    (`307`) to `/debt/login`.
  - `/debt/login` returns `200` and includes `noindex, nofollow, nocache`.
  - `/robots.txt` disallows `/debt/` and `/debt/login`.
  - `/`, `/wedding/login`, `/wedding/signup`, and `/studio` still return `200`.
  - `/wedding/dashboard`, `/checkout`, and `/admin` still redirect to the
    existing wedding login as before.
- No migration was applied, no production data was read or changed, and no
  deployment was performed.

The following tests require the reviewed migration and explicit owner bootstrap:
owner login/logout, authenticated CRUD, partial/full payment behavior, payment

## Installment fields (migration 041)

Account form supports:

- application/creditor name,
- optional loan label so one application can have multiple loans,
- nominal amount,
- installment status such as `5/12 bulan`,
- recurring due day, e.g. every 5th.

`041_debt_installments.sql` adds `installment_month`,
`installment_total_months`, and `due_day`. Run it after `040` before deploying
the updated account form. Existing `due_date` values are backfilled into
`due_day`.

Due days are calculated from the selected day each month; days 29–31 are

## Per-installment nominal (migration 042)

`042_debt_installment_amount.sql` adds `installment_amount`.

Example:

```text
Nominal per angsuran : Rp 200.000
Status tenor         : 10/12 bulan
Remaining            : 2 × Rp 200.000 = Rp 400.000
```

The form also accepts a due month plus due day. `due_date` stores the selected
next due date; `due_day` stores the recurring day for display. Existing due
dates are preserved and can be backfilled by migration 041.

clamped to the last valid day of shorter months.
## Paying an installment

The account card shows:

- Total kontrak
- Cicilan per bulan
- Sisa

For an eligible active account, **Bayar angsuran** calls the atomic
`pay_debt_installment` RPC. It records the monthly payment, advances the due
month by one, increments the installment status, and marks the account `paid`
on the final installment.

Example:

```text
Sebelum : 10/12 · Rp 200.000/bulan · sisa Rp 400.000
Bayar   : Rp 200.000
Sesudah : 11/12 · jatuh tempo bulan berikutnya · sisa Rp 200.000
```

Migration `043_debt_pay_installment.sql` is required for this button.


reversal, schedule transitions, and cross-owner RLS/REST tests.

## Remaining setup steps

1. Review `supabase/wedding/040_debt_tracker.sql`.
2. Apply it manually in the correct Supabase project after approval.
3. Bootstrap the owner UUID using the SQL above.
4. Run the authenticated and unauthorized RLS tests.
5. Only then deploy the application.

