-- Kefoo Wedding Planner - 018: vendor groups with comparable options.
-- Run EIGHTEENTH, after 017. Additive, backfills old rows, never deletes.
--
-- Before: public.vendors was flat (one row = one vendor).
-- After : vendor_groups = the decision (e.g. "MUA"), vendors = the options
--         (MUA A / B / C). Exactly one option may be selected per group, and
--         that rule is enforced by the database, not the UI.

-- 1. Groups.
create table if not exists public.vendor_groups (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  category text not null default '' check (char_length(category) <= 80),
  notes text check (notes is null or char_length(notes) <= 2000),
  pic_internal text check (pic_internal is null or char_length(pic_internal) <= 120),
  status text not null default 'diskusi'
    check (status in ('diskusi', 'dp', 'lunas')),
  selected_vendor_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);

create index if not exists vendor_groups_wedding_idx
  on public.vendor_groups (wedding_id, archived_at);
create index if not exists vendor_groups_category_idx
  on public.vendor_groups (wedding_id, category);

drop trigger if exists vendor_groups_updated_at on public.vendor_groups;
create trigger vendor_groups_updated_at before update on public.vendor_groups
  for each row execute function public.set_updated_at();

-- 2. Options: vendors gain group_id, archive flag and a quotation file.
alter table public.vendors add column if not exists group_id uuid;
alter table public.vendors add column if not exists archived_at timestamptz;
alter table public.vendors add column if not exists quotation_path text
  check (quotation_path is null or char_length(quotation_path) <= 500);

-- Needed so a group can only select an option that belongs to that same group.
create unique index if not exists vendors_id_group_idx
  on public.vendors (id, group_id);

-- An option can only belong to a group of the SAME wedding.
alter table public.vendors drop constraint if exists vendors_group_wedding_fkey;
alter table public.vendors
  add constraint vendors_group_wedding_fkey
  foreign key (group_id, wedding_id)
  references public.vendor_groups (id, wedding_id) on delete cascade;

-- One selected option per group: the pointer lives on the group, so the
-- database cannot represent two selections. The composite FK guarantees the
-- selected option is an option of that very group.
alter table public.vendor_groups drop constraint if exists vendor_groups_selected_fk;
alter table public.vendor_groups
  add constraint vendor_groups_selected_fk
  foreign key (selected_vendor_id, id)
  references public.vendors (id, group_id)
  on delete set null (selected_vendor_id);

create index if not exists vendor_groups_selected_idx
  on public.vendor_groups (selected_vendor_id);
-- 3. Backfill: every existing vendor becomes the selected option of its own
--    group, so no financial history is lost and totals stay identical.
do $$
declare
  r record;
  g uuid;
begin
  for r in select * from public.vendors where group_id is null order by created_at loop
    insert into public.vendor_groups (wedding_id, name, category, notes, pic_internal, status)
    values (
      r.wedding_id,
      coalesce(nullif(trim(r.category), ''), 'Vendor'),
      coalesce(r.category, ''),
      r.notes,
      r.pic_internal,
      case when r.payment_status in ('diskusi','dp','lunas') then r.payment_status else 'diskusi' end
    )
    returning id into g;

    update public.vendors set group_id = g where id = r.id;

    update public.vendor_groups set selected_vendor_id = r.id where id = g;
  end loop;
end;
$$;

-- 4. Status is derived from real payments, never fabricated.
--    price  = agreed_price (if set) else quoted_price of the selected option
--    paid   = sum of recorded payments for the selected option
create or replace function public.refresh_vendor_group_status(p_group_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_selected uuid;
  v_price numeric;
  v_paid numeric;
  v_status text;
begin
  select selected_vendor_id into v_selected
  from public.vendor_groups where id = p_group_id;

  if v_selected is null then
    update public.vendor_groups set status = 'diskusi' where id = p_group_id;
    return 'diskusi';
  end if;

  select coalesce(agreed_price, quoted_price) into v_price
  from public.vendors where id = v_selected;

  select coalesce(sum(amount), 0) into v_paid
  from public.vendor_payments where vendor_id = v_selected;

  if v_price is not null and v_price > 0 and v_paid >= v_price then
    v_status := 'lunas';
  elsif v_paid > 0 then
    v_status := 'dp';
  else
    v_status := 'diskusi';
  end if;

  update public.vendor_groups set status = v_status where id = p_group_id;
  return v_status;
end;
$$;

revoke all on function public.refresh_vendor_group_status(uuid) from public, anon;
grant execute on function public.refresh_vendor_group_status(uuid) to authenticated;

-- 5. RLS: same ownership model as every other planning table.
do $$
declare
  t text;
begin
  foreach t in array array['vendor_groups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I',
      'Subscribed members manage ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.wedding_has_access(wedding_id)) with check (public.wedding_has_access(wedding_id))',
      'Subscribed members manage ' || t, t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
