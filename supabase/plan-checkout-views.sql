-- Log checkout page opens (plan selected) per workspace.
-- Run in Supabase SQL Editor after payment-submissions.sql.

create table if not exists public.plan_checkout_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('starter', 'growth', 'scale')),
  created_at timestamptz not null default now()
);

create index if not exists plan_checkout_views_org_id_idx
  on public.plan_checkout_views (org_id);

create index if not exists plan_checkout_views_created_at_idx
  on public.plan_checkout_views (created_at desc);

alter table public.plan_checkout_views enable row level security;

drop policy if exists "Org members can read checkout views" on public.plan_checkout_views;
create policy "Org members can read checkout views"
  on public.plan_checkout_views for select
  using (public.is_org_member(org_id));

drop policy if exists "Org members can insert checkout views" on public.plan_checkout_views;
create policy "Org members can insert checkout views"
  on public.plan_checkout_views for insert
  with check (public.is_org_member(org_id));

notify pgrst, 'reload schema';
