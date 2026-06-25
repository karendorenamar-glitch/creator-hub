import { formatMoney, formatCompactFee, parseCompactFee } from "@/lib/format";

export const MIN_CREATOR_FEE = 0;

export const CREATOR_ALREADY_EXISTS_ERROR = "This creator already exists.";
export const CREATOR_NAME_EXISTS_ERROR = CREATOR_ALREADY_EXISTS_ERROR;

export function normalizeCreatorName(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export function normalizeCreatorContact(
  value: string | null | undefined,
): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export function normalizeCreatorPlatformUsername(
  value: string | null | undefined,
): string | null {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

  return normalized || null;
}

export function getCreatorDisplayUsername(creator: {
  platform: string;
  tiktok_username: string | null;
  instagram_username: string | null;
  threads_username: string | null;
}): string | null {
  switch (creator.platform) {
    case "TikTok":
      return creator.tiktok_username;
    case "Instagram":
      return creator.instagram_username;
    case "Threads":
      return creator.threads_username;
    default:
      return (
        creator.tiktok_username ??
        creator.instagram_username ??
        creator.threads_username
      );
  }
}

export function formatCreatorUsername(username: string | null | undefined): string {
  const normalized = normalizeCreatorPlatformUsername(username);
  return normalized ? `@${normalized}` : "—";
}

export function formatCreatorListUsername(creator: {
  platform: string;
  tiktok_username: string | null;
  instagram_username: string | null;
  threads_username: string | null;
}): string {
  const username = getCreatorDisplayUsername(creator);
  return formatCreatorUsername(username);
}

export function slugifyCreatorName(name: string | null | undefined): string {
  return normalizeCreatorName(name).toLowerCase().replace(/[^a-z0-9]/g, "");
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
    return { fee: 0 };
  }

  const fee = parseIDRInput(value);

  if (fee < MIN_CREATOR_FEE) {
    return { error: `Fee must be ${MIN_CREATOR_FEE} or greater.` };
  }

  return { fee };
}

export function formatOptionalNumber(value: number): string {
  return value > 0 ? formatNumber(value) : "—";
}

export function formatOptionalIDR(value: number): string {
  return value > 0 ? formatIDR(value) : "—";
}

export function formatCreatorDisplayName(name: string | null | undefined): string {
  const trimmed = normalizeCreatorName(name);
  return trimmed || "—";
}

function formatRelativeAgo(
  createdAt: string | null | undefined,
  prefix: string,
  fallback: string,
): string {
  if (!createdAt) {
    return fallback;
  }

  const timestamp = new Date(createdAt).getTime();

  if (Number.isNaN(timestamp)) {
    return fallback;
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 45) {
    return `${prefix} just now`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${prefix} ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${prefix} ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${prefix} ${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${prefix} ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${prefix} ${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(days / 365);
  return `${prefix} ${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatUploadedAgo(createdAt: string | null | undefined): string {
  return formatRelativeAgo(createdAt, "Uploaded", "Uploaded recently");
}

export function formatLastUpdatedAgo(
  createdAt: string | null | undefined,
): string {
  return formatRelativeAgo(createdAt, "Last updated", "Last updated recently");
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
  return formatMoney(value);
}

export function formatIDR(value: number): string {
  return formatMoney(value);
}

export { formatMoney, formatCompactFee, parseCompactFee } from "@/lib/format";

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

export function formatCPE(budget: number, engagements: number): string {
  if (engagements === 0) return "—";
  return formatCurrency(budget / engagements);
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function getSafeRedirectPath(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed?.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}
