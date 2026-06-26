-- Grant an add-on to a customer workspace (run in Supabase → SQL Editor).
--
-- 1. Find the workspace:
--    select o.id, o.name, o.plan, u.email
--    from public.organizations o
--    join public.org_members om on om.org_id = o.id
--    join auth.users u on u.id = om.user_id
--    where lower(u.email) = lower('email-pelanggan@example.com');
--
-- 2. Edit customer_email + add_on_type + quantity below, then Run.

do $$
declare
  customer_email text := 'email-pelanggan@example.com';
  add_on_type text := 'additional_user';
  -- additional_user | content_planner | additional_creators
  -- additional_tracked_contents | advanced_dashboard | payout_tracking
  add_on_quantity integer := 1;
  payment_note text := 'Paid via bank transfer on 2026-06-25';
  target_org_id uuid;
begin
  if add_on_type not in (
    'additional_user',
    'content_planner',
    'additional_creators',
    'additional_tracked_contents',
    'advanced_dashboard',
    'payout_tracking'
  ) then
    raise exception 'Unknown add_on_type: %', add_on_type;
  end if;

  if add_on_quantity < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  select o.id
  into target_org_id
  from public.organizations o
  join public.org_members om on om.org_id = o.id
  join auth.users u on u.id = om.user_id
  where lower(u.email) = lower(customer_email)
  order by om.created_at asc
  limit 1;

  if target_org_id is null then
    raise exception 'Workspace not found for %', customer_email;
  end if;

  insert into public.org_add_ons (
    org_id,
    add_on_type,
    quantity,
    notes
  )
  values (
    target_org_id,
    add_on_type,
    add_on_quantity,
    payment_note
  );

  raise notice 'Granted % x % to org %', add_on_quantity, add_on_type, target_org_id;
end;
$$;

-- Verify active add-ons:
-- select o.name, u.email, a.add_on_type, a.quantity, a.status, a.notes, a.created_at
-- from public.org_add_ons a
-- join public.organizations o on o.id = a.org_id
-- join public.org_members om on om.org_id = o.id
-- join auth.users u on u.id = om.user_id
-- where lower(u.email) = lower('email-pelanggan@example.com')
-- order by a.created_at desc;

notify pgrst, 'reload schema';
