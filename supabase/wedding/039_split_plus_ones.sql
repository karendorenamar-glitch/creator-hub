-- Kefoo Wedding Planner - 039: one real guest row per person.
-- DATA-ONLY migration. No schema objects are changed.
--
-- A guest with plus_ones = N is expanded into N + 1 guest rows. Every row keeps
-- the same name, phone, side, group, invitation/RSVP state and notes, but has
-- plus_ones = 0. This lets the seating planner place each person in a separate
-- chair. Existing assignments are kept; a multi-seat assignment is reduced to
-- its first chair, and the newly created rows can be seated independently.
--
-- Safe to re-run: after the update, plus_ones = 0 so the insert selects nothing.

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
