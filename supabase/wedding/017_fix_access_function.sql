-- Kefoo Wedding Planner - 017: RLS must honour account-level lifetime access.
-- Run SEVENTEENTH, after 016. Idempotent, safe to re-run.
--
-- Why: customers pay BEFORE onboarding, so access is granted to the ACCOUNT
-- (public.user_entitlements), not to the wedding row. The live
-- wedding_has_access() was still the 012 version, which only looked at
-- weddings.lifetime_access_granted_at and subscriptions. Result: the app let
-- a paid customer into the dashboard, but every RLS write (vendors, budget,
-- guests, checklist, inspiration) was rejected with 42501, which the UI shows
-- as "Langganan Anda belum aktif".

create or replace function public.wedding_has_access(p_wedding_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_wedding_member(p_wedding_id)
     and (
       -- 1. Temporary open-access switch (migration 004).
       not public.requires_subscription()

       -- 2. Legacy monthly subscription.
       or public.has_active_subscription(p_wedding_id)

       -- 3. Legacy per-wedding lifetime flag.
       or exists (
         select 1 from public.weddings w
         where w.id = p_wedding_id
           and w.lifetime_access_granted_at is not null
       )

       -- 4. The signed-in member paid for lifetime access (new flow).
       or exists (
         select 1 from public.user_entitlements e
         where e.user_id = auth.uid()
           and e.lifetime_access_granted_at is not null
       )

       -- 5. The partner benefits when the wedding owner already paid.
       or exists (
         select 1
         from public.weddings w
         join public.user_entitlements e on e.user_id = w.created_by
         where w.id = p_wedding_id
           and e.lifetime_access_granted_at is not null
       )
     );
$$;

-- Version marker so the live definition can be confirmed in one query.
create or replace function public.wedding_has_access_version()
returns text
language sql stable
as $$ select '017'::text; $$;

revoke all on function public.wedding_has_access(uuid) from public, anon;
revoke all on function public.wedding_has_access_version() from public, anon;
grant execute on function public.wedding_has_access(uuid) to authenticated;
grant execute on function public.wedding_has_access_version() to authenticated;

notify pgrst, 'reload schema';