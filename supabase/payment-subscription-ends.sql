-- Run once in Supabase → SQL Editor.
-- Adds subscription end date (payment_date + 30 days) to payment submissions.

alter table public.payment_submissions
  add column if not exists subscription_ends_at date;

update public.payment_submissions
set subscription_ends_at = (payment_date + interval '30 days')::date
where subscription_ends_at is null;

notify pgrst, 'reload schema';
