-- Kefoo Wedding Planner - 014: read-only SELECT access for admins.
-- Run FOURTEENTH, after 013. Additive. NO write access is granted here.
--
-- Admin status is still decided ONLY by public.admins + is_admin().
-- These policies exist because the support dashboard must read weddings,
-- memberships and subscriptions across accounts. Without them, RLS correctly
-- denies those rows to an admin acting through the anon/authenticated role.

-- 1. Weddings: admins may read all rows (KPI, search by couple, access status).
drop policy if exists "Admins read weddings" on public.weddings;
create policy "Admins read weddings" on public.weddings
  for select to authenticated
  using (public.is_admin());

-- 2. Memberships: needed to map a user to their wedding(s) and role.
drop policy if exists "Admins read wedding members" on public.wedding_members;
create policy "Admins read wedding members" on public.wedding_members
  for select to authenticated
  using (public.is_admin());

-- 3. Subscriptions: legacy monthly entitlements shown next to lifetime access.
drop policy if exists "Admins read subscriptions" on public.subscriptions;
create policy "Admins read subscriptions" on public.subscriptions
  for select to authenticated
  using (public.is_admin());

-- 4. RSVP totals for support context (read-only).
drop policy if exists "Admins read invitation rsvps" on public.invitation_rsvps;
create policy "Admins read invitation rsvps" on public.invitation_rsvps
  for select to authenticated
  using (public.is_admin());

-- 5. Invitation publish state (whether the couple has shared an invitation).
drop policy if exists "Admins read invitations" on public.invitations;
create policy "Admins read invitations" on public.invitations
  for select to authenticated
  using (public.is_admin());

-- Deliberately NOT added:
--   * any INSERT/UPDATE/DELETE policy for admins on these tables
--   * any change to payments policies (approval stays in approve_payment())
--   * any change to require_subscription or open-access behaviour

notify pgrst, 'reload schema';
