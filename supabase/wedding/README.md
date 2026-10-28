# Kefoo Wedding Planner - database migrations (manual)

These files are for the NEW Supabase project only. They are not applied
automatically. Nothing here drops tables or deletes data. The legacy Kefoo SQL
files in `supabase/*.sql` are untouched and must NOT be run on the new project.

## Execution order (Supabase Dashboard > SQL Editor)

1. `001_core.sql` - weddings, members, invites, subscription, payment history, helper functions, RLS
2. `002_features.sql` - budget, vendors, expenses, guests, checklist, inspiration, RLS
3. `003_functions.sql` - `create_wedding()` and `accept_wedding_invite()`
4. `004_open_access_toggle.sql` - optional subscription switch (open access by default)
5. `005_vendor_billing.sql` - free-text vendor category, 3-state payment status
   (diskusi / dp / lunas), internal PIC, and the `vendor_payments` history table
6. `006_payment_proofs.sql` - private `payment-proofs` storage bucket and the
   `proof_path` column on `vendor_payments`
7. `007_inspiration_images.sql` - free-text inspiration category, uploaded
   `image_path` column and the private `inspiration-images` bucket
8. `008_inspiration_album.sql` - `inspiration_photos` table so each item can
   hold several photos (existing single photos are migrated into it)

Later migrations (`009`-`028`) are documented in their `APPLY_*.md` files.
The current invite migration is `029_link_based_invites.sql`: it makes invite
email optional and adds `accept_wedding_invite_link()` for link-based partner
invites. The current guest migration is `030_guest_side.sql`: it adds an
additive `side` category (`bride`, `groom`, `unassigned`) without changing
existing guest records or RLS policies. The seating/rooms migration is
`031_seating_rooms.sql`: five additive tables with wedding-scoped composite
foreign keys and the existing `wedding_has_access` RLS rule. The one-person
guest split is `039_split_plus_ones.sql` (data-only; documented in `APPLY_039.md`).

`005` is required for the Budget tab: vendor payments are stored as individual
rows, so "total sudah dibayarkan" is never counted twice. Existing
`vendors.amount_paid` values are preserved as one opening payment per vendor,
and a trigger keeps that column in sync afterwards. No rows are deleted.

`004` is the temporary paywall switch. It never disables RLS or ownership: a user
must still be a member of the wedding. It only makes the subscription optional.

- Open access: `update public.app_settings set require_subscription = false;`
- Paywall back on: `update public.app_settings set require_subscription = true;`

If `004` has not been run, the app falls back to requiring an active subscription.

Run each file in full, in order. Re-running is safe. Status: all four files
**pass a PostgreSQL syntax parse** (pglast), but they have **not been executed
against a live database** yet. Run them on the new, empty project and send me
any error message verbatim.

## Ownership model

- A **wedding** is the workspace. Data belongs to a wedding, not to a user.
- `wedding_members` links users to a wedding: one `owner` (creator) and at most
  one `partner` (max 2 members, enforced by trigger). No other roles.
- The partner joins via a secret invite token accepted by
  `accept_wedding_invite_link()` (029) after signing in. The account email does
  not need to match anything; the owner can revoke the link and it stays valid
  until accepted or revoked. The old email-matched `accept_wedding_invite()`
  remains for backwards compatibility but is not used by the current invite page.

## Security (RLS)

- RLS is enabled on every table. `anon` has no access to anything.
- Access check = `is_wedding_member(wedding_id)` (reads `wedding_members` for `auth.uid()`).
- Planning data (budget, vendors, expenses, guests, tasks, inspiration) requires
  `wedding_has_access()` = member AND active, unexpired subscription. The check
  is in the database, so editing IDs or calling the API directly cannot bypass it.
- Composite foreign keys make cross-wedding references impossible (an expense
  cannot point at another couple's category or vendor; a task cannot be assigned
  to a non-member).
- Members can always read/update wedding settings and read their subscription
  and payment history, so an unpaid user can still see the billing page.
- Subscriptions and payment history have NO insert/update/delete policies:
  only the server using the service-role key can change them.
- Creating a wedding / accepting an invite go through `SECURITY DEFINER`
  functions that check `auth.uid()` and pin `search_path`.

## Concurrency and integrity hardening

- **Invite acceptance is token-based.** `accept_wedding_invite_link()` requires a
  signed-in user, a valid unused token, and one accepted invite. The signed-in
  email is intentionally not compared; the token is the shared secret. Invitees
  should treat the link like a password and owners can revoke it while pending.
- **Max-2-members is race-safe.** The trigger locks the `weddings` row
  (`for update`) before counting, so two simultaneous accepts for the same
  wedding serialize. The count runs as a new statement and sees the winner's
  committed row under READ COMMITTED (Supabase/PostgREST default; the SQL Editor
  also runs READ COMMITTED). Under REPEATABLE READ the guard would not hold.
- **Duplicate weddings are blocked twice.** `create_wedding()` takes a
  transaction-level advisory lock keyed by user id, and
  `wedding_members_one_owned_wedding_idx` (unique partial index on `user_id`
  where `role = 'owner'`) is the hard database backstop.
- **`weddings.id` and `weddings.created_by` are immutable** after creation, via
  a BEFORE UPDATE trigger, because RLS otherwise lets both members update the row.
- Trigger functions are `SECURITY DEFINER` with `search_path = ''` and EXECUTE
  revoked from `public`, `anon` and `authenticated`. PostgreSQL does not check
  EXECUTE privilege when a trigger fires, so the triggers still work.

## Subscription

- Exactly one plan: `wedding_planner_pro`, Rp20,000 / month (constraints enforce
  the plan code, price and interval). No free plan, no trial.
- New weddings start `inactive`. Until a real payment integration exists, all
  planning data is locked by RLS. To test before payments exist, the founder can
  activate a wedding manually in the SQL Editor (`999_dev_manual_activation.sql`,
  optional, not part of the normal order).

## Environment variables (set in `/workspace/.env.local`, git-ignored)

| Variable | Where used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (publishable key) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (future payment webhooks, admin tasks) | **yes** |

Leftover Kefoo variables (`APIFY_TOKEN`, `RESEND_API_KEY`, `PAYMENT_*`) are not
needed for the wedding app.
