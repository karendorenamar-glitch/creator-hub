-- Campaign creator deal type (paid, barter, voucher) + optional barter/voucher value.
-- Run once in Supabase → SQL Editor.

alter table public.campaign_creators
  add column if not exists deal_type text not null default 'paid'
    check (deal_type in ('paid', 'barter', 'voucher'));

alter table public.campaign_creators
  add column if not exists deal_value numeric;

update public.campaign_creators
set deal_type = 'paid'
where deal_type is null;

notify pgrst, 'reload schema';
