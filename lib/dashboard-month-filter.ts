export type DashboardMonthValue = "all" | `${number}-${string}`;

import { SUPPORTED_PLATFORMS } from "@/lib/platforms";

export const DASHBOARD_PLATFORMS = SUPPORTED_PLATFORMS;

export type DashboardPlatformValue =
  | "all"
  | (typeof DASHBOARD_PLATFORMS)[number];

export function parseDashboardPlatformParam(
  param: string | null | undefined,
): DashboardPlatformValue {
  if (!param || param === "all") {
    return "all";
  }

  const match = DASHBOARD_PLATFORMS.find(
    (platform) => platform.toLowerCase() === param.toLowerCase(),
  );

  return match ?? "all";
}

export function matchesDashboardPlatform(
  creatorPlatform: string | null | undefined,
  filter: DashboardPlatformValue,
): boolean {
  if (filter === "all") {
    return true;
  }

  return (creatorPlatform ?? "").toLowerCase() === filter.toLowerCase();
}

export function formatPlatformLabel(platform: DashboardPlatformValue): string {
  return platform === "all" ? "All platforms" : platform;
}

export function getCurrentMonthKey(): DashboardMonthValue {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export const MAX_DASHBOARD_COMPARE_MONTHS = 3;

export function parseDashboardMonthParam(
  param: string | null | undefined,
): DashboardMonthValue {
  const months = parseDashboardMonthsParam(param);
  return months[0] ?? getCurrentMonthKey();
}

export function parseDashboardMonthsParam(
  param: string | null | undefined,
  validMonths?: Set<DashboardMonthValue>,
): DashboardMonthValue[] {
  if (!param || param === "all") {
    return [getCurrentMonthKey()];
  }

  const parsed: DashboardMonthValue[] = [];

  for (const part of param.split(",")) {
    const trimmed = part.trim();
    if (!/^\d{4}-\d{2}$/.test(trimmed)) {
      continue;
    }

    const month = trimmed as DashboardMonthValue;

    if (validMonths && !validMonths.has(month)) {
      continue;
    }

    if (!parsed.includes(month)) {
      parsed.push(month);
    }

    if (parsed.length >= MAX_DASHBOARD_COMPARE_MONTHS) {
      break;
    }
  }

  return parsed.length > 0 ? parsed : [getCurrentMonthKey()];
}

export function buildAvailableDashboardMonths(options: {
  currentMonth: DashboardMonthValue;
  previousMonths: DashboardMonthValue[];
}): DashboardMonthValue[] {
  const months = [options.currentMonth, ...options.previousMonths];
  return [...new Set(months)].filter((month) => month !== "all");
}

export function formatMonthsLabel(months: DashboardMonthValue[]): string {
  if (months.length === 0) {
    return formatMonthLabel(getCurrentMonthKey());
  }

  if (months.length === 1) {
    return formatMonthLabel(months[0]);
  }

  return months.map((month) => formatMonthLabel(month)).join(", ");
}

export function getMonthDateRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = String(lastDay).padStart(2, "0");

  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${day}`,
  };
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === "all") {
    return "All Time";
  }

  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function monthKeyFromDate(date: string): DashboardMonthValue {
  return date.slice(0, 7) as DashboardMonthValue;
}

export function buildDashboardMonthOptions(
  campaignStartDates: string[],
): {
  currentMonth: DashboardMonthValue;
  previousMonths: DashboardMonthValue[];
} {
  const currentMonth = getCurrentMonthKey();
  const monthSet = new Set<DashboardMonthValue>();

  for (const startDate of campaignStartDates) {
    if (startDate) {
      monthSet.add(monthKeyFromDate(startDate));
    }
  }

  monthSet.add(currentMonth);

  const previousMonths = [...monthSet]
    .filter((month) => month !== currentMonth && month !== "all")
    .sort((a, b) => b.localeCompare(a));

  return { currentMonth, previousMonths };
}
