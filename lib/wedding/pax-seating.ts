import type {
  Guest,
  SeatingAssignment,
  SeatingEventType,
  SeatingTable,
} from "./db-types";

function countPeople(guest: { plus_ones?: number | null }): number {
  const raw = Number(guest.plus_ones ?? 0);
  const plusOnes = Number.isFinite(raw)
    ? Math.min(20, Math.max(0, Math.floor(raw)))
    : 0;
  return 1 + plusOnes;
}

/**
 * A single allocated pax. The guest record stays unique; `paxIndex` is the
 * position inside the guest's `seating_assignments.seat_ids` array.
 */
export type SeatingPaxAllocation = {
  assignment: SeatingAssignment;
  guest: Guest;
  paxIndex: number;
  targetId: string;
  tableId: string;
};

export type PaxUnit = {
  guest: Guest;
  paxIndex: number;
  allocation: SeatingPaxAllocation | null;
};

export function paxKey(guestId: string, paxIndex: number) {
  return `${guestId}:${paxIndex}`;
}

/**
 * Resolve one stored seat reference to the id shown in the planner.
 * Akad references are individual chairs. Dinner references are normalized to
 * the parent table; older rows may still contain child-chair ids.
 */
export function resolvePaxTarget(
  seatId: string,
  eventType: SeatingEventType,
  tableById: Map<string, SeatingTable>,
): string | null {
  if (eventType === "akad") return seatId;
  const table = tableById.get(seatId);
  if (!table) return null;
  return table.parent_table_id ?? table.id;
}

export function assignmentSeatIds(assignment: SeatingAssignment): string[] {
  if (assignment.seat_ids?.length) return assignment.seat_ids;
  return assignment.table_id ? [assignment.table_id] : [];
}

export function buildPaxAllocations(
  assignments: SeatingAssignment[],
  guests: Guest[],
  tables: SeatingTable[],
  eventType: SeatingEventType,
): SeatingPaxAllocation[] {
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const allocations: SeatingPaxAllocation[] = [];

  for (const assignment of assignments) {
    const guest = guestById.get(assignment.guest_id);
    if (!guest) continue;
    const total = countPeople(guest);
    const seats = assignmentSeatIds(assignment)
      .map((seatId) => resolvePaxTarget(seatId, eventType, tableById))
      .filter((seatId): seatId is string => Boolean(seatId))
      .slice(0, total);

    seats.forEach((targetId, index) => {
      allocations.push({
        assignment,
        guest,
        paxIndex: index + 1,
        targetId,
        tableId: targetId,
      });
    });
  }

  return allocations;
}

export function allocationsByGuest(
  allocations: SeatingPaxAllocation[],
): Map<string, SeatingPaxAllocation[]> {
  const result = new Map<string, SeatingPaxAllocation[]>();
  for (const allocation of allocations) {
    const list = result.get(allocation.guest.id) ?? [];
    list.push(allocation);
    result.set(allocation.guest.id, list);
  }
  return result;
}

export function unassignedPaxUnits(
  guests: Guest[],
  allocations: SeatingPaxAllocation[],
): PaxUnit[] {
  const byGuest = allocationsByGuest(allocations);
  const units: PaxUnit[] = [];
  for (const guest of guests) {
    const allocated = new Set(
      (byGuest.get(guest.id) ?? []).map((item) => item.paxIndex),
    );
    for (let paxIndex = 1; paxIndex <= countPeople(guest); paxIndex += 1) {
      if (!allocated.has(paxIndex)) {
        units.push({ guest, paxIndex, allocation: null });
      }
    }
  }
  return units;
}

export function paxUnits(
  guests: Guest[],
  allocations: SeatingPaxAllocation[],
): PaxUnit[] {
  const byGuest = allocationsByGuest(allocations);
  const units: PaxUnit[] = [];
  for (const guest of guests) {
    const guestAllocations = byGuest.get(guest.id) ?? [];
    for (let paxIndex = 1; paxIndex <= countPeople(guest); paxIndex += 1) {
      units.push({
        guest,
        paxIndex,
        allocation:
          guestAllocations.find((item) => item.paxIndex === paxIndex) ?? null,
      });
    }
  }
  return units;
}

export function nextPaxIndex(
  guest: Guest,
  allocations: SeatingPaxAllocation[],
): number | null {
  const allocated = new Set(
    allocations
      .filter((item) => item.guest.id === guest.id)
      .map((item) => item.paxIndex),
  );
  for (let paxIndex = 1; paxIndex <= countPeople(guest); paxIndex += 1) {
    if (!allocated.has(paxIndex)) return paxIndex;
  }
  return null;
}

export function allocatedPaxCount(
  guestId: string,
  allocations: SeatingPaxAllocation[],
): number {
  return allocations.filter((item) => item.guest.id === guestId).length;
}

export function tablePaxCount(
  targetId: string,
  allocations: SeatingPaxAllocation[],
): number {
  return allocations.filter((item) => item.targetId === targetId).length;
}
