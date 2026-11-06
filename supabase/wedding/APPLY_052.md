# Apply 052 — affiliate self-registration

One function. No table change, no data change, no customer-facing behaviour
touched.

## What it adds

`public.register_affiliate(p_full_name, p_email)` — security definer, callable by
an authenticated user only. It:

1. rejects anonymous callers (`auth.uid()` required);
2. rejects a second profile for the same account;
3. derives a 6-character uppercase code from the account id and appends a
   counter until it is unique;
4. inserts the row with `status = 'active'` and returns the code.

## Run

Supabase SQL Editor -> `supabase/wedding/052_affiliate_registration.sql`.

## Verify

```sql
select proname from pg_proc
where proname = 'register_affiliate';
```

## Rollback

```sql
drop function if exists public.register_affiliate(text, text);
```
