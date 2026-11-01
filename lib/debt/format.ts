const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** IDR without unnecessary decimals, e.g. Rp 30.000. */
export function formatRupiah(value: number | null | undefined): string {
  const amount =
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `Rp ${rupiahFormatter.format(Math.round(amount))}`;
}

export function formatDebtDate(
  iso: string | null | undefined,
  fallback = "—",
): string {
  if (!iso) return fallback;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return fallback;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * A specific month's due date, clamped to the last day of short months.
 * `month` must be YYYY-MM.
 */
export function dueDateForMonth(day: number, month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return `${month}-${String(safeDay).padStart(2, "0")}`;
}

/** YYYY-MM-DD in the business timezone, without locale-dependent parsing. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Advance a date by whole calendar months, letting JS clamp short months. */
export function addMonthsISO(iso: string, months = 1): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}

/**
 * The next occurrence of a monthly due day. Days beyond the end of a short
 * month are clamped to that month's last day.
 */
export function nextDueDateForDay(day: number, today = todayISO()): string {
  const [year, month] = today.split("-").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");

  function dateForMonth(y: number, m: number): string {
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return `${y}-${pad(m)}-${pad(Math.min(Math.max(day, 1), lastDay))}`;
  }

  const current = dateForMonth(year, month);
  if (current >= today) return current;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return dateForMonth(nextYear, nextMonth);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function daysUntil(iso: string, today = todayISO()): number {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${iso}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function percentOf(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}
