-- OPTIONAL, MANUAL, NOT PART OF THE NORMAL ORDER.
-- For founder testing only, before a payment gateway exists. This does NOT
-- record a payment; it just opens access for one wedding for 30 days.
-- Replace the email below, then run in the SQL Editor (runs as admin).

update public.subscriptions s
set status = 'active',
    started_at = now(),
    current_period_end = now() + interval '30 days'
where s.wedding_id = (
  select wm.wedding_id
  from public.wedding_members wm
  join auth.users u on u.id = wm.user_id
  where lower(u.email) = lower('REPLACE_WITH_YOUR_EMAIL') and wm.role = 'owner'
  limit 1
);
