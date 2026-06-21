export const MIN_CREATOR_FEE = 0;

export const CREATOR_ALREADY_EXISTS_ERROR = "Creator already exists.";
export const CREATOR_NAME_EXISTS_ERROR =
  "A creator with this name already exists. Please add a contact number to differentiate.";

export function normalizeCreatorName(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function normalizeCreatorContact(
  value: string | null | undefined,
): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export function normalizeCreatorUsername(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function parseIDRInput(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  }

  if (value == null) {
    return 0;
  }

  const normalized = String(value).replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
}

export function validateCreatorFee(
  value: string | number | null | undefined,
): { fee?: number; error?: string } {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return { error: "Fee is required." };
  }

  const fee = parseIDRInput(value);

  if (fee < MIN_CREATOR_FEE) {
    return { error: `Fee must be ${MIN_CREATOR_FEE} or greater.` };
  }

  return { fee };
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export function formatEngagementRate(value: number): string {
  return formatPercent(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 0,
  }).format(value);
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatIDRDecimal(
  value: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatCPV(budget: number, views: number): string {
  if (views === 0) return "—";
  return formatCurrency(budget / views);
}

export function formatCreatorCPV(fee: number, views: number): string {
  if (views === 0) return "—";
  return formatIDRDecimal(fee / views);
}

export function formatCreatorCPL(fee: number, likes: number): string {
  if (likes === 0) return "—";
  return formatIDRDecimal(fee / likes);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export type EngagementTotals = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export function calculateEngagementRate(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
): number {
  if (!Number.isFinite(views) || views <= 0) return 0;

  const engagement =
    (Number.isFinite(likes) ? likes : 0) +
    (Number.isFinite(comments) ? comments : 0) +
    (Number.isFinite(shares) ? shares : 0) +
    (Number.isFinite(saves) ? saves : 0);

  return (engagement / views) * 100;
}

export function calculateEngagementRateFromTotals(
  totals: EngagementTotals,
): number {
  return calculateEngagementRate(
    totals.views,
    totals.likes,
    totals.comments,
    totals.shares,
    totals.saves,
  );
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
