# Apply migration 029 (link-based partner invitations)

Migration `029_link_based_invites.sql` changes invitations from email-matched to
link-based. Review it before deploying the updated Wedding Settings card.

What it changes:

- `wedding_invites.email` becomes nullable (new invitations store no email);
- the email format check allows `null`;
- adds `accept_wedding_invite_link(p_token)`, which accepts an unused token for
  the signed-in user **without requiring an email match**;
- invitation links no longer expire on a timer: they stay valid until accepted
  once or revoked by the owner (this is separate from the partner's login
  session, which continues normally after acceptance);
- existing invites and the old `accept_wedding_invite()` function are untouched.

Run manually in the Supabase SQL Editor after 028:

1. Paste and run the full `029_link_based_invites.sql`.
2. Confirm the function exists:

```sql
select proname
from pg_proc
where proname = 'accept_wedding_invite_link';
```

3. Confirm `email` is nullable:

```sql
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'wedding_invites'
  and column_name = 'email';
```

Expected: `is_nullable = YES`.

Confirm link expiry is optional:

```sql
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'wedding_invites'
  and column_name = 'expires_at';
```

Expected: `is_nullable = YES` and no default.

Before this migration is applied, creating a new invitation from Wedding Settings
will fail because `email` is still `NOT NULL`. Apply 029 first, then deploy the
app change.
