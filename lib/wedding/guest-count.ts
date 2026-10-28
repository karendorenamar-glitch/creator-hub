import type { GuestSide } from "./db-types";

export type GuestSideSummary = {
  bride: { records: number; people: number };
  groom: { records: number; people: number };
  unassigned: { records: number; people: number };
  assigned: { records: number; people: number };
};

export function guestPeopleCount(guest: {
  plus_ones?: number | null;
}): number {
  const raw = Number(guest.plus_ones ?? 0);
  const plusOnes = Number.isFinite(raw)
    ? Math.min(20, Math.max(0, Math.floor(raw)))
    : 0;
  return 1 + plusOnes;
}

export function totalGuestPeople(
  guests: Array<{ plus_ones?: number | null }>,
): number {
  return guests.reduce((sum, guest) => sum + guestPeopleCount(guest), 0);
}

/**
 * Turn a guest row with companions into one row per person. The name and the
 * other guest fields stay the same so the original invitation grouping is not
 * lost; seating can then be assigned one chair at a time per row.
 */
export function expandGuestPeople<T extends { plus_ones?: number | null }>(
  guest: T,
): T[] {
  const people = guestPeopleCount(guest);
  return Array.from({ length: people }, () => ({
    ...guest,
    plus_ones: 0,
  }));
}

/**
 * Older rows (before migration 030) have no `side` value. Treat those rows as
 * unassigned so the UI and totals remain safe during a phased deploy.
 */
export function guestSideOf(guest: {
  side?: string | null;
}): GuestSide {
  return guest.side === "bride" || guest.side === "groom"
    ? guest.side
    : "unassigned";
}

export function summarizeGuestSides(
  guests: Array<{ side?: string | null; plus_ones?: number | null }>,
): GuestSideSummary {
  const bride = { records: 0, people: 0 };
  const groom = { records: 0, people: 0 };
  const unassigned = { records: 0, people: 0 };

  for (const guest of guests) {
    const side = guestSideOf(guest);
    const people = guestPeopleCount(guest);
    const bucket =
      side === "bride" ? bride : side === "groom" ? groom : unassigned;
    bucket.records += 1;
    bucket.people += people;
  }

  return {
    bride,
    groom,
    unassigned,
    assigned: {
      records: bride.records + groom.records,
      people: bride.people + groom.people,
    },
  };
}
