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

export function parseDashboardMonthParam(
  param: string | null | undefined,
): DashboardMonthValue {
  if (param === "all") {
    return "all";
  }

  if (param && /^\d{4}-\d{2}$/.test(param)) {
    return param as DashboardMonthValue;
  }

  return getCurrentMonthKey();
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
