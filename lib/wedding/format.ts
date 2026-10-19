/** IDR and date helpers for the wedding planner. */

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** Full Rupiah amount, e.g. "Rp 20.000". */
export function formatIDR(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp ${numberFormatter.format(Math.round(Math.abs(amount)))}`;
}

/** Short Rupiah label for cards, e.g. "Rp 1,2 jt", "Rp 500 rb". */
export function formatIDRCompact(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${trimZero(abs / 1_000_000_000)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${trimZero(abs / 1_000_000)} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${trimZero(abs / 1_000)} rb`;
  }
  return `${sign}Rp ${numberFormatter.format(Math.round(abs))}`;
}

function trimZero(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "").replace(".", ",");
}

export function formatWeddingDate(iso: string | null, locale: "en" | "id") {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null, locale: "en" | "id") {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Whole days from today until `iso`. Negative means overdue. */
export function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(target.getTime());
  start.setHours(0, 0, 0, 0);

  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

export function percentOf(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}
