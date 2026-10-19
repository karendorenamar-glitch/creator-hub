-- Kefoo Wedding Planner - 001 core: weddings, members, invites, subscription.
-- Run FIRST in the Supabase SQL Editor of the NEW project. Safe to re-run.
-- Non-destructive: only creates objects; never drops or deletes data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- weddings: one workspace per couple
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  partner_one_name text not null check (char_length(trim(partner_one_name)) between 1 and 80),
  partner_two_name text check (partner_two_name is null or char_length(partner_two_name) <= 80),
  wedding_date date,
  location text check (location is null or char_length(location) <= 200),
  estimated_guest_count integer check (estimated_guest_count is null or estimated_guest_count >= 0),
  total_budget numeric(14,0) not null default 0 check (total_budget >= 0), -- IDR, whole rupiah
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists weddings_set_updated_at on public.weddings;
create trigger weddings_set_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();

-- id and created_by are set at creation and must never change. RLS lets both
-- members update other settings columns, so this trigger closes that gap.
create or replace function public.protect_wedding_immutable_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'weddings.id cannot be changed.';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'weddings.created_by cannot be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists weddings_protect_immutable on public.weddings;
create trigger weddings_protect_immutable before update on public.weddings
  for each row execute function public.protect_wedding_immutable_columns();

revoke all on function public.protect_wedding_immutable_columns() from public, anon, authenticated;

-- wedding_members: who may access a wedding (owner + partner, max 2)
create table if not exists public.wedding_members (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create index if not exists wedding_members_user_idx on public.wedding_members (user_id);
-- At most one owner per wedding, and at most one OWNED wedding per user.
-- The second index is a database-level guard against concurrent
-- create_wedding() calls producing two weddings for the same owner; it backs
-- up the advisory lock used in 003_functions.sql.
create unique index if not exists wedding_members_one_owner_idx
  on public.wedding_members (wedding_id) where role = 'owner';
create unique index if not exists wedding_members_one_owned_wedding_idx
  on public.wedding_members (user_id) where role = 'owner';

-- Enforce the 2-member cap.
--
-- Race safety: the wedding row is locked BEFORE counting. Two concurrent
-- accepts for the same wedding therefore serialize - the second blocks on
-- "for update" until the first transaction commits, then its count statement
-- (a new snapshot under READ COMMITTED, Supabase/PostgREST's default level)
-- sees the committed member and raises. Under REPEATABLE READ the count would
-- use the older snapshot, so this guard assumes READ COMMITTED, which is what
-- the Supabase API and dashboard use.
--
-- SECURITY DEFINER with an empty search_path so the lock and count are not
-- affected by caller privileges or a caller-modified search_path.
-- Trigger invocation does not require EXECUTE privilege, so it is revoked.
create or replace function public.enforce_wedding_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.weddings where id = new.wedding_id for update;

  if (select count(*) from public.wedding_members
      where wedding_id = new.wedding_id) >= 2 then
    raise exception 'A wedding can have at most 2 members.';
  end if;
  return new;
end;
$$;

drop trigger if exists wedding_members_limit on public.wedding_members;
create trigger wedding_members_limit before insert on public.wedding_members
  for each row execute function public.enforce_wedding_member_limit();

revoke all on function public.enforce_wedding_member_limit() from public, anon, authenticated;

-- wedding_invites: invite a partner by token
create table if not exists public.wedding_invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists wedding_invites_wedding_idx on public.wedding_invites (wedding_id);
create unique index if not exists wedding_invites_pending_idx
  on public.wedding_invites (wedding_id, lower(email)) where accepted_at is null;

-- ---------------------------------------------------------------------------
-- subscriptions: exactly ONE plan - Wedding Planner Pro, Rp20,000 / month.
-- No free plan, no trial. A wedding starts 'inactive' until a real payment is
-- recorded by trusted server code (future payment integration).
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null unique references public.weddings(id) on delete cascade,
  plan_code text not null default 'wedding_planner_pro'
    check (plan_code = 'wedding_planner_pro'),
  price_idr integer not null default 20000 check (price_idr = 20000),
  billing_interval text not null default 'month' check (billing_interval = 'month'),
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'expired', 'canceled')),
  started_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or (started_at is not null and current_period_end is not null))
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- subscription_payments: payment history (changed only by server/service role)
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  amount_idr integer not null check (amount_idr > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text,            -- future payment gateway name
  provider_reference text,  -- future gateway transaction id
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_wedding_idx
  on public.subscription_payments (wedding_id, created_at desc);
create unique index if not exists subscription_payments_provider_ref_idx
  on public.subscription_payments (provider, provider_reference)
  where provider_reference is not null;

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS (security definer avoids recursive policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = p_wedding_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_wedding_owner(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = p_wedding_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.has_active_subscription(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where wedding_id = p_wedding_id
      and status = 'active'
      and current_period_end > now()
  );
$$;

-- Member of the wedding AND subscription active. Gates all planning data.
create or replace function public.wedding_has_access(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_wedding_member(p_wedding_id)
     and public.has_active_subscription(p_wedding_id);
$$;

revoke all on function public.is_wedding_member(uuid) from public, anon;
revoke all on function public.is_wedding_owner(uuid) from public, anon;
revoke all on function public.has_active_subscription(uuid) from public, anon;
revoke all on function public.wedding_has_access(uuid) from public, anon;
grant execute on function public.is_wedding_member(uuid) to authenticated;
grant execute on function public.is_wedding_owner(uuid) to authenticated;
grant execute on function public.has_active_subscription(uuid) to authenticated;
grant execute on function public.wedding_has_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS for core tables
-- ---------------------------------------------------------------------------
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.wedding_invites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Members always read their wedding and update its settings (so an unpaid user
-- can still set it up and reach the billing page). Weddings are created only
-- through create_wedding() in 003_functions.sql, so there is no insert policy.
drop policy if exists "Members read wedding" on public.weddings;
create policy "Members read wedding" on public.weddings
  for select to authenticated using (public.is_wedding_member(id));

drop policy if exists "Members update wedding" on public.weddings;
create policy "Members update wedding" on public.weddings
  for update to authenticated
  using (public.is_wedding_member(id))
  with check (public.is_wedding_member(id));

drop policy if exists "Owner deletes wedding" on public.weddings;
create policy "Owner deletes wedding" on public.weddings
  for delete to authenticated using (public.is_wedding_owner(id));

-- Members see co-members; owner may remove the partner. Rows are created only
-- by create_wedding() / accept_wedding_invite() (security definer).
drop policy if exists "Members read members" on public.wedding_members;
create policy "Members read members" on public.wedding_members
  for select to authenticated using (public.is_wedding_member(wedding_id));

drop policy if exists "Owner removes partner" on public.wedding_members;
create policy "Owner removes partner" on public.wedding_members
  for delete to authenticated
  using (public.is_wedding_owner(wedding_id) and role <> 'owner');

-- Invites: members read, owner creates/revokes. Accepting is via RPC only.
drop policy if exists "Members read invites" on public.wedding_invites;
create policy "Members read invites" on public.wedding_invites
  for select to authenticated using (public.is_wedding_member(wedding_id));

drop policy if exists "Owner creates invites" on public.wedding_invites;
create policy "Owner creates invites" on public.wedding_invites
  for insert to authenticated
  with check (public.is_wedding_owner(wedding_id) and invited_by = auth.uid());

drop policy if exists "Owner revokes invites" on public.wedding_invites;
create policy "Owner revokes invites" on public.wedding_invites
  for delete to authenticated using (public.is_wedding_owner(wedding_id));

-- Subscriptions and payments: members READ only. There are deliberately no
-- insert/update/delete policies, so only the server using the service-role key
-- can change billing state. A user can never mark themselves as paid.
drop policy if exists "Members read subscription" on public.subscriptions;
create policy "Members read subscription" on public.subscriptions
  for select to authenticated using (public.is_wedding_member(wedding_id));

drop policy if exists "Members read payments" on public.subscription_payments;
create policy "Members read payments" on public.subscription_payments
  for select to authenticated using (public.is_wedding_member(wedding_id));

-- Defense in depth: strip Supabase's default broad grants, then grant only
-- what each role actually needs.
revoke all on public.weddings, public.wedding_members, public.wedding_invites,
  public.subscriptions, public.subscription_payments from anon, authenticated;
grant select, update, delete on public.weddings to authenticated;
grant select, delete on public.wedding_members to authenticated;
grant select, insert, delete on public.wedding_invites to authenticated;
grant select on public.subscriptions, public.subscription_payments to authenticated;

