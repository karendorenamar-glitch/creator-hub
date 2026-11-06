# Apply 055 — admin suspend / delete affiliate

Two security-definer RPCs, admin-only (`is_admin()`), `search_path` pinned.

- `admin_set_affiliate_status(uuid, text, text)` — sets `active` or `suspended`,
  stores the reason when suspending and clears it when reactivating.
- `admin_delete_affiliate(uuid)` — deletes the affiliate profile **only when it has
  no clicks, referrals, commissions or payouts**; otherwise raises an error and
  the admin is told to suspend instead.

No table, policy or data is changed by the migration itself.

## Run

Supabase SQL Editor -> `supabase/wedding/055_admin_affiliate_actions.sql`.

## Verify

```sql
select proname from pg_proc
where proname in ('admin_set_affiliate_status','admin_delete_affiliate');
```
