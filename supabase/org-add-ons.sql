-- Workspace add-ons (manual admin grants after payment).
-- Run once in Supabase → SQL Editor.
--
-- Add-on types match landing page pricing:
--   additional_user              (+1 team seat per quantity)
--   content_planner              (unlock Content Planner)
--   additional_creators          (+50 creators per quantity)
--   additional_tracked_contents  (+100 tracked videos per quantity)
--   advanced_dashboard           (unlock performance dashboard)
--   payout_tracking              (unlock payout tracking)

create table if not exists public.org_add_ons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  add_on_type text not null check (
    add_on_type in (
      'additional_user',
      'content_planner',
      'additional_creators',
      'additional_tracked_contents',
      'advanced_dashboard',
      'payout_tracking'
    )
  ),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists org_add_ons_org_id_idx
  on public.org_add_ons (org_id);

create index if not exists org_add_ons_active_org_idx
  on public.org_add_ons (org_id)
  where status = 'active';

alter table public.org_add_ons enable row level security;

drop policy if exists "Org members can read active add-ons" on public.org_add_ons;
create policy "Org members can read active add-ons"
  on public.org_add_ons
  for select
  using (
    status = 'active'
    and exists (
      select 1
      from public.org_members om
      where om.org_id = org_add_ons.org_id
        and om.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers used by team seat checks
-- ---------------------------------------------------------------------------

create or replace function public.org_add_on_quantity(
  p_org_id uuid,
  p_add_on_type text
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
  (
    select sum(quantity)::integer
    from public.org_add_ons
    where org_id = p_org_id
      and add_on_type = p_add_on_type
      and status = 'active'
  ),
  0
  );
$$;

create or replace function public.org_member_limit(p_org_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  org_record public.organizations%rowtype;
  base_limit integer;
  user_bonus integer;
begin
  select * into org_record
  from public.organizations
  where id = p_org_id;

  if not found then
    return 1;
  end if;

  if org_record.member_limit is not null then
    base_limit := org_record.member_limit;
  else
    base_limit := case org_record.plan
      when 'growth' then 3
      when 'scale' then 5
      else 1
    end;
  end if;

  user_bonus := public.org_add_on_quantity(p_org_id, 'additional_user');

  return base_limit + user_bonus;
end;
$$;

create or replace function public.org_allows_team_invites(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and o.plan in ('growth', 'scale')
  )
  or public.org_add_on_quantity(p_org_id, 'additional_user') > 0;
$$;

notify pgrst, 'reload schema';
