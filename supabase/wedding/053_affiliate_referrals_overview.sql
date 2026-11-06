-- Kefoo — 053: read-only referral overview for the signed-in affiliate
-- Adds one security-definer RPC. No table, RLS or payment rule is changed.

begin;

create or replace function public.affiliate_referrals_overview()
returns table (
  customer_reference text,
  attributed_at timestamptz,
  signup_completed_at timestamptz,
  payments_total bigint,
  payments_approved bigint,
  payments_pending bigint,
  payments_rejected bigint,
  commission_idr numeric,
  commission_usd numeric
)
language sql stable security definer set search_path = ''
as $$
  with mine as (
    select r.id, r.customer_user_id, r.customer_reference,
           r.attributed_at, r.signup_completed_at
    from public.affiliate_referrals r
    join public.affiliates a on a.id = r.affiliate_id
    where a.user_id = auth.uid()
  ),
  pay as (
    select p.user_id,
           count(*) as total,
           count(*) filter (where p.status = 'approved') as approved,
           count(*) filter (where p.status = 'pending_review') as pending,
           count(*) filter (where p.status = 'rejected') as rejected
    from public.payments p
    where p.user_id in (select customer_user_id from mine)
    group by p.user_id
  ),
  com as (
    select c.referral_id,
           sum(case when c.currency = 'IDR' then c.commission_amount else 0 end) as commission_idr,
           sum(case when c.currency = 'USD' then c.commission_amount else 0 end) as commission_usd
    from public.affiliate_commissions c
    where c.referral_id in (select id from mine)
    group by c.referral_id
  )
  select m.customer_reference,
         m.attributed_at,
         m.signup_completed_at,
         coalesce(pay.total, 0),
         coalesce(pay.approved, 0),
         coalesce(pay.pending, 0),
         coalesce(pay.rejected, 0),
         coalesce(com.commission_idr, 0),
         coalesce(com.commission_usd, 0)
  from mine m
  left join pay on pay.user_id = m.customer_user_id
  left join com on com.referral_id = m.id
  order by m.attributed_at desc;
$$;

revoke all on function public.affiliate_referrals_overview() from public, anon;
grant execute on function public.affiliate_referrals_overview() to authenticated;

notify pgrst, 'reload schema';

commit;
