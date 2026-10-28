import type { Guest, SeatingAssignment, SeatingTable } from "./db-types";

function countPeople(guest: { plus_ones?: number | null }): number {
  const raw = Number(guest.plus_ones ?? 0);
  const plusOnes = Number.isFinite(raw)
    ? Math.min(20, Math.max(0, Math.floor(raw)))
    : 0;
  return 1 + plusOnes;
}

export type DinnerTableGuest = {
  assignment: SeatingAssignment;
  guest: Guest;
};

export type DinnerTableSummary = {
  table: SeatingTable;
  guests: DinnerTableGuest[];
  occupiedSeats: number;
  remainingSeats: number;
  seatObjectCount: number;
  freeChairIds: string[];
};

/**
 * Resolve the dinner table that owns an assignment.
 * New rows point at a child chair; older rows may point at the table itself.
 */
export function dinnerAssignmentTableId(
  assignment: SeatingAssignment,
  tableById: Map<string, SeatingTable>,
  dinnerTableIds: Set<string>,
): string | null {
  const candidates = [assignment.table_id, ...(assignment.seat_ids ?? [])];

  for (const id of candidates) {
    const table = tableById.get(id);
    if (!table) continue;
    if (dinnerTableIds.has(id)) return id;

    const parentId = table.parent_table_id;
    if (parentId && dinnerTableIds.has(parentId)) return parentId;
  }

  return null;
}

/**
 * Aggregate the existing seating rows into rectangular dinner-table cards.
 * No data is mutated here; this is only the read model used by the list UI.
 */
export function dinnerTableSummaries(
  tables: SeatingTable[],
  assignments: SeatingAssignment[],
  guests: Guest[],
): DinnerTableSummary[] {
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const dinnerTables = tables.filter(
    (table) => table.capacity > 1 && table.kind !== "chair",
  );
  const dinnerTableIds = new Set(dinnerTables.map((table) => table.id));
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));

  const assignedChairIds = new Set<string>();
  for (const assignment of assignments) {
    assignedChairIds.add(assignment.table_id);
    for (const seatId of assignment.seat_ids ?? []) {
      assignedChairIds.add(seatId);
    }
  }

  const guestsByTable = new Map<string, DinnerTableGuest[]>();
  for (const table of dinnerTables) guestsByTable.set(table.id, []);

  for (const assignment of assignments) {
    const tableId = dinnerAssignmentTableId(
      assignment,
      tableById,
      dinnerTableIds,
    );
    if (!tableId) continue;

    const guest = guestById.get(assignment.guest_id);
    if (!guest) continue;
    guestsByTable.get(tableId)?.push({ assignment, guest });
  }

  return dinnerTables.map((table) => {
    const tableGuests = guestsByTable.get(table.id) ?? [];
    const occupiedSeats = tableGuests.reduce(
      (sum, item) => sum + countPeople(item.guest),
      0,
    );
    const childChairs = tables.filter(
      (candidate) =>
        candidate.parent_table_id === table.id && candidate.capacity === 1,
    );
    const freeChairIds = childChairs
      .filter((candidate) => !assignedChairIds.has(candidate.id))
      .map((candidate) => candidate.id);

    return {
      table,
      guests: tableGuests,
      occupiedSeats,
      remainingSeats: Math.max(0, table.capacity - occupiedSeats),
      seatObjectCount: childChairs.length,
      freeChairIds,
    };
  });
}

export function unassignedDinnerGuests(
  guests: Guest[],
  assignments: SeatingAssignment[],
): Guest[] {
  const seatedGuestIds = new Set(
    assignments.map((assignment) => assignment.guest_id),
  );
  return guests.filter((guest) => !seatedGuestIds.has(guest.id));
}
