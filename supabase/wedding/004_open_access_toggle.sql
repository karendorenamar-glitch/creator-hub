-- Kefoo Wedding Planner - 004: temporary "no subscription required" switch.
-- Run FOURTH, after 001-003. Safe to re-run. Non-destructive.
--
-- This does NOT disable Row Level Security and does NOT bypass ownership:
-- a user must still be a member of the wedding to read or write its data.
-- It only makes the *subscription* check optional.
--
-- Open access (default here):   require_subscription = false
-- Turn the paywall back on:     update public.app_settings set require_subscription = true;
--
-- Only one row exists (id = true).

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  require_subscription boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Start with open access for testing. Re-running never flips an existing value.
insert into public.app_settings (id, require_subscription)
values (true, false)
on conflict (id) do nothing;

create or replace function public.requires_subscription()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select require_subscription from public.app_settings where id = true),
    true
  );
$$;

revoke all on function public.requires_subscription() from public, anon;
grant execute on function public.requires_subscription() to authenticated;

-- Members keep full access while require_subscription is false.
create or replace function public.wedding_has_access(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_wedding_member(p_wedding_id)
     and (
       not public.requires_subscription()
       or public.has_active_subscription(p_wedding_id)
     );
$$;

revoke all on function public.wedding_has_access(uuid) from public, anon;
grant execute on function public.wedding_has_access(uuid) to authenticated;

-- The app reads this flag to hide the "not active" notices. Read-only for users.
alter table public.app_settings enable row level security;

drop policy if exists "Authenticated read settings" on public.app_settings;
create policy "Authenticated read settings" on public.app_settings
  for select to authenticated using (true);

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;

notify pgrst, 'reload schema';
