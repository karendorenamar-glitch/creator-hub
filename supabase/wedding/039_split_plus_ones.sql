-- Kefoo Wedding Planner - 039: superseded, DO NOT APPLY.
--
-- The pax-seating design keeps ONE guest record per group and stores one
-- allocation slot per pax in seating_assignments.seat_ids. It does not duplicate
-- guest rows. This file is retained only as history for databases where it was
-- already run; do not run it on a current database.
--
-- Original behavior (only if you intentionally need the old duplicate-row
-- model): a guest with plus_ones = N became N + 1 guest rows.
--
-- The guard below intentionally stops an accidental run. The old statements are
-- kept only for audit/history.

do $$
begin
  raise exception 'Migration 039 is superseded. Do not duplicate guest rows; use the existing seat_ids pax model instead.';
end;
$$;

begin;

begin;

-- Release the extra chairs held by a multi-person assignment. The original
-- guest keeps the first chair; the new companion rows start unassigned.
update public.seating_assignments as assignment
set seat_ids = array[assignment.seat_ids[1]]
where cardinality(assignment.seat_ids) > 1
  and exists (
    select 1
    from public.guests as guest
    where guest.id = assignment.guest_id
      and guest.plus_ones > 0
  );

insert into public.guests (
  wedding_id,
  name,
  phone,
  email,
  guest_group,
  invitation_status,
  rsvp_status,
  plus_ones,
  notes,
  side
)
select
  guest.wedding_id,
  guest.name,
  guest.phone,
  guest.email,
  guest.guest_group,
  guest.invitation_status,
  guest.rsvp_status,
  0,
  guest.notes,
  guest.side
from public.guests as guest
cross join lateral generate_series(1, guest.plus_ones) as companion
where guest.plus_ones > 0;

update public.guests
set plus_ones = 0
where plus_ones > 0;

commit;
