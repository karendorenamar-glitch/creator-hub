-- Add invoice proof URL to payouts.

alter table public.payouts
  add column if not exists proof_url text;
