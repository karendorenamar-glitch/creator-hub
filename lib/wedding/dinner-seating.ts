import type { Guest, SeatingAssignment, SeatingTable } from "./db-types";

function countPeople(guest: { plus_ones?: number | null }): number {
  const raw = Number(guest.plus_ones ?? 0);
  const plusOnes = Number.isFinite(raw)
    ? Math.min(20, Math.max(0, Math.floor(raw)))
    : 0;
  return 1 + plusOnes;
}

function resolveTarget(
  seatId: string,
  tableById: Map<string, SeatingTable>,
): string | null {
  const table = tableById.get(seatId);
  if (!table) return null;
  return table.parent_table_id ?? table.id;
}

function dinnerAllocations(
  assignments: SeatingAssignment[],
  guests: Guest[],
  tables: SeatingTable[],
) {
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const result: { guest: Guest; paxIndex: number; targetId: string }[] = [];
  for (const assignment of assignments) {
    const guest = guestById.get(assignment.guest_id);
    if (!guest) continue;
    const seats = (assignment.seat_ids?.length
      ? assignment.seat_ids
      : [assignment.table_id])
      .map((id) => resolveTarget(id, tableById))
      .filter((id): id is string => Boolean(id))
      .slice(0, countPeople(guest));
    seats.forEach((targetId, index) => {
      result.push({ guest, paxIndex: index + 1, targetId });
    });
  }
  return result;
}

function unassignedPax(
  guests: Guest[],
  assignments: SeatingAssignment[],
  tables: SeatingTable[],
) {
  const allocations = dinnerAllocations(assignments, guests, tables);
  const allocated = new Map<string, Set<number>>();
  for (const item of allocations) {
    const set = allocated.get(item.guest.id) ?? new Set<number>();
    set.add(item.paxIndex);
    allocated.set(item.guest.id, set);
  }
  const result: { guest: Guest; paxIndex: number }[] = [];
  for (const guest of guests) {
    const set = allocated.get(guest.id) ?? new Set<number>();
    for (let paxIndex = 1; paxIndex <= countPeople(guest); paxIndex += 1) {
      if (!set.has(paxIndex)) result.push({ guest, paxIndex });
    }
  }
  return result;
}

export type DinnerTableGuest = {
  guest: Guest;
  paxIndex: number;
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
 * Aggregate pax allocations into the dinner-table cards. One guest group can
 * appear on several tables because every pax is an independent allocation.
 */
export function dinnerTableSummaries(
  tables: SeatingTable[],
  assignments: SeatingAssignment[],
  guests: Guest[],
): DinnerTableSummary[] {
  const dinnerTables = tables.filter(
    (table) => table.capacity > 1 && table.kind !== "chair",
  );
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const allocations = dinnerAllocations(assignments, guests, tables);
  const guestsByTable = new Map<string, DinnerTableGuest[]>();
  for (const table of dinnerTables) guestsByTable.set(table.id, []);

  for (const allocation of allocations) {
    const table = tableById.get(allocation.targetId);
    if (!table || table.capacity <= 1) continue;
    guestsByTable.get(table.id)?.push({
      guest: allocation.guest,
      paxIndex: allocation.paxIndex,
    });
  }

  return dinnerTables.map((table) => {
    const tableGuests = guestsByTable.get(table.id) ?? [];
    const childChairs = tables.filter(
      (candidate) =>
        candidate.parent_table_id === table.id && candidate.capacity === 1,
    );
    return {
      table,
      guests: tableGuests,
      occupiedSeats: tableGuests.length,
      remainingSeats: Math.max(0, table.capacity - tableGuests.length),
      seatObjectCount: childChairs.length,
      freeChairIds: childChairs.map((candidate) => candidate.id),
    };
  });
}

export function unassignedDinnerPax(
  guests: Guest[],
  assignments: SeatingAssignment[],
  tables: SeatingTable[],
): { guest: Guest; paxIndex: number }[] {
  return unassignedPax(guests, assignments, tables);
}
