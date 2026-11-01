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

## Installment schedule model

Every debt uses exactly one model: a manually configured list of installments
stored in `debt_schedules`. There is no fixed-versus-flexible account type.

- Each installment has its own due date and scheduled amount, and the amount
  may differ month to month.
- Amount paid and remaining per installment are derived from `debt_payments`
  rows linked through `schedule_id`. Nothing is stored twice.
- Status is derived, never typed by hand:
  - `upcoming` - future month, nothing paid yet
  - `unpaid` - due in the current month, nothing paid yet
  - `partially_paid` - some amount paid, balance remains, not past due
  - `paid` - paid amount covers the scheduled amount
  - `overdue` - due date has passed and a balance remains
- Opening or switching a month never changes a status. Only a recorded payment
  can.
- Installments without payments can be edited, cancelled, or deleted.
- Installments with payments can no longer be edited. Deleting one cancels it
  instead, so the history stays intact.

### Balance semantics

- Total paid = sum of payments where `reversed_at is null`.
- Remaining = sum of remaining balances of all non-cancelled installments.
  It is never negative.
- Original debt = `total_amount_due` when filled, otherwise the sum of the
  installments. When both exist and differ, the UI shows a mismatch notice and
  keeps using the installments for remaining and progress.
- Progress = paid / (paid + remaining).
- Overdue amount = remaining of installments whose due date has passed.
- A partial payment never closes an installment, and paying one installment
  never advances another.
- Payment history is never silently deleted. Reversal sets `reversed_at` and
  `reversal_reason`; the row stays visible and stops counting toward balances.
- Accounts with any installment or payment history are closed rather than
  hard-deleted.
- The monthly target is the sum of installments due in the current business
  month; monthly paid is the sum of payments dated in that month.

### Creating a debt: tenor and monthly amount

The form mirrors how the debt is actually known:

1. **Nama utang / kreditur**.
2. **Tenor: sudah dibayar / total**, e.g. `5 / 12` bulan.
3. **Nominal per bulan**, with two options:
   - **Samakan nominal hingga akhir tempo** - one amount for every remaining
     month. The form generates `total - paid` installments, e.g. `12 - 5 = 7`.
   - **Nominal berbeda** - the form shows one box per remaining month, each with
     its own month and amount.
4. **Jatuh tempo tiap tanggal** and **bulan angsuran pertama**.
5. Optional: utang awal, tanggal mulai/akhir, jenis, status, catatan.

Saving creates the debt and its installment rows in one step. Only the months
that are still unpaid are created; the already-paid months are reflected through
the tenor badge and the balance.

Balance handling:

- Same amount mode: contract = monthly x total tenor, paid = monthly x paid
  months, remaining = monthly x remaining months.
- Different amounts mode: only the remaining rows are tracked. If **utang awal**
  is filled, paid is derived as `utang awal - total sisa angsuran`; otherwise
  progress starts from what is recorded.
- Editing the monthly amount or tenor regenerates the schedule only when no
  installment has a payment yet. Renaming a debt or editing notes never touches
  the installments.

### Debts that still use the older tenor columns

Debts saved before the schedule model (`installment_amount`,
`installment_total_months`, `installment_month`, `due_day`) are not reset to
zero. While such a debt has no installment rows:

- paid, remaining, and progress are computed from the tenor columns,
- the next installment uses the stored due date (or the stored due day),
- the card shows a notice and a **Buat angsuran** button.

A debt with only an original amount and recorded payments falls back to that
amount minus payments, so its balance stays visible too.

**Buat angsuran dari tenor lama** (accounts page) converts every remaining
month into a real installment row: `remaining months x installment amount`,
starting from the stored due date, one row per month. Debts that already have
installments are skipped, so the action is safe to repeat. After conversion the
fallback stops being used and everything is driven by the schedule.

## Monthly view

`/debt/schedule` defaults to the current month.

- Month navigation uses `?month=YYYY-MM`, account filter uses `?account=<id>`.
- Cards show scheduled total, payments dated in that month, and remaining on
  that month's installments.
- Counts show paid, partially paid, unpaid, overdue, and upcoming installments
  for the selected month.
- Each installment row shows the debt name, due date, scheduled amount, paid
  amount, remaining, and status.
- Actions: **Bayar penuh** (pays the remaining balance), **Bayar sebagian**
  (opens `/debt/payments` pre-filled), **Edit** (only while nothing is paid),
  **Batalkan**, **Aktifkan lagi**, and **Hapus** (only while nothing is paid).
- "Buat beberapa angsuran" generates N monthly rows with one nominal; each row
  can then be edited individually.

## Paying an installment

`/debt/payments` records a payment against one specific installment:

- the installment list only shows rows that still have a remaining balance,
- a partial amount is allowed, a full amount closes the installment,
- the amount cannot exceed the installment's remaining balance,
- the submit button is disabled while the request is pending, and the server
  re-validates the remaining balance on every request.

`Bayar penuh` writes a payment with an idempotency key derived from the
installment state, so a double submit cannot create two payments.

## Privacy and SEO

- `/debt/*` is excluded in `app/robots.ts`.
- The debt layout and login page set `robots: noindex, nofollow, nocache`.
- No debt data is placed in URLs (only `month` and `account` identifiers).
- Debt data is not written to analytics or error logs.

## Required environment variables

Only the existing public Supabase values are used:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No service-role key is required by the Debt Tracker application code.

## Legacy migrations 041-043

- `041_debt_installments.sql` and `042_debt_installment_amount.sql` added
  columns (`installment_month`, `installment_total_months`, `due_day`,
  `installment_amount`) that the schedule model no longer uses. The columns can
  stay; nothing reads them anymore.
- `043_debt_pay_installment.sql` added the `pay_debt_installment` RPC. The
  server action now works without it, so this migration is optional.
- No new migration is required for the schedule model.

## Manual verification after migration

The base migration is intentionally not applied by this implementation. After
approval and migration:

1. Bootstrap the owner UUID.
2. Test owner login at `/debt/login`.
3. Test unauthenticated redirects for all private routes.
4. Use a second authenticated Supabase user without an allowlist row and verify
   that REST access to all four tables is denied.
5. Verify the second user cannot insert into `debt_allowed_users`.
6. Test partial payments, full payments, reversal, edits, deletion of unpaid
   installments, overdue installments, and the seven-day window.
7. Verify month switching does not change any installment status.
8. Smoke-test the existing `/wedding`, `/checkout`, and `/admin` routes.

## Remaining setup steps

1. Review `supabase/wedding/040_debt_tracker.sql`.
2. Apply it manually in the correct Supabase project after approval.
3. Bootstrap the owner UUID using the SQL above.
4. Run the authenticated and unauthorized RLS tests.
5. Only then deploy the application.
