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
