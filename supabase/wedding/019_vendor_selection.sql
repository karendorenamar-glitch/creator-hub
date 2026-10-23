-- Kefoo Wedding Planner - 019: vendor selection, payment kinds, receipt per payment.
-- Run NINETEENTH, after 018. Additive + idempotent. Deletes nothing.
--
-- Adds the model the product needs:
--   * per option selection state  : alternatif ("Masih Dipikirkan") / terpilih
--   * per payment kind           : dp / lanjutan / pelunasan
--   * per payment receipt path   : proof file in the private bucket
--   * group status derived from the SELECTED option, never from a label

-- 1. Selection state per vendor option.
alter table public.vendors
  add column if not exists selection_status text not null default 'alternatif';

alter table public.vendors drop constraint if exists vendors_selection_status_check;
alter table public.vendors add constraint vendors_selection_status_check
  check (selection_status in ('alternatif', 'terpilih'));

-- 2. Payment kind and receipt path per transaction.
alter table public.vendor_payments
  add column if not exists payment_kind text not null default 'dp',
  add column if not exists proof_path text;

alter table public.vendor_payments drop constraint if exists vendor_payments_kind_check;
alter table public.vendor_payments add constraint vendor_payments_kind_check
  check (payment_kind in ('dp', 'lanjutan', 'pelunasan'));

-- 3. Backfill: an option that has payments was the chosen one.
update public.vendors v
set selection_status = 'terpilih'
where v.id in (select distinct vendor_id from public.vendor_payments);

-- Keep the group pointer consistent with the backfilled selection.
update public.vendor_groups g
set selected_vendor_id = v.id
from public.vendors v
where v.group_id = g.id
  and v.selection_status = 'terpilih'
  and g.selected_vendor_id is null;

-- 4. Group status is derived from the SELECTED option only.
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

notify pgrst, 'reload schema';
