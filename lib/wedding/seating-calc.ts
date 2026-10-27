import { guestPeopleCount } from "./guest-count";

export type SeatingGuest = {
  id: string;
  plus_ones?: number | null;
};

export type SeatingTableLike = {
  id: string;
  capacity: number;
};

export type SeatingAssignmentLike = {
  table_id: string;
  guest_id: string;
};

export function guestMapById(guests: SeatingGuest[]) {
  return new Map(guests.map((guest) => [guest.id, guest]));
}

export function seatingPeopleByTable(
  assignments: SeatingAssignmentLike[],
  guestById: Map<string, SeatingGuest>,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const assignment of assignments) {
    const guest = guestById.get(assignment.guest_id);
    if (!guest) continue;
    result.set(
      assignment.table_id,
      (result.get(assignment.table_id) ?? 0) + guestPeopleCount(guest),
    );
  }
  return result;
}

export function seatingStats(
  tables: SeatingTableLike[],
  assignments: SeatingAssignmentLike[],
  guests: SeatingGuest[],
) {
  const guestById = guestMapById(guests);
  const peopleByTable = seatingPeopleByTable(assignments, guestById);
  const seatedGuestIds = new Set(assignments.map((item) => item.guest_id));
  const seatedPeople = guests.reduce(
    (sum, guest) =>
      seatedGuestIds.has(guest.id) ? sum + guestPeopleCount(guest) : sum,
    0,
  );
  const totalSeats = tables.reduce(
    (sum, table) => sum + Math.max(0, Number(table.capacity) || 0),
    0,
  );
  const totalGuestPeople = guests.reduce(
    (sum, guest) => sum + guestPeopleCount(guest),
    0,
  );

  return {
    totalTables: tables.length,
    totalSeats,
    seatedPeople,
    remainingSeats: Math.max(0, totalSeats - seatedPeople),
    unassignedPeople: Math.max(0, totalGuestPeople - seatedPeople),
    peopleByTable,
  };
}
