import type { ContentPlannerAgency } from "@/types/database";
import { SUPPORTED_PLATFORMS } from "@/lib/platforms";

export const CONTENT_PLANNER_PLATFORMS = SUPPORTED_PLATFORMS;

export const CONTENT_PLANNER_STATUSES = [
  "Idea",
  "Draft",
  "Ready",
  "Scheduled",
  "Posted",
] as const;

export type ContentPlannerPlatform =
  (typeof CONTENT_PLANNER_PLATFORMS)[number];

export type ContentPlannerStatus =
  (typeof CONTENT_PLANNER_STATUSES)[number];

export type ContentPlannerInput = {
  content_pillar: string;
  content_idea: string;
  hook: string;
  creator_names: string[];
  campaign_id: string;
  inspiration_url: string;
  planned_date: string;
  platform: ContentPlannerPlatform;
  status: ContentPlannerStatus;
};

export function normalizeCampaignId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type ContentPlannerView = "list" | "calendar";

export const contentPlannerStatusStyles: Record<string, string> = {
  Idea: "bg-kefoo-50 text-kefoo-700",
  Scripting: "bg-kefoo-50 text-kefoo-700",
  Filming: "bg-orange-50 text-orange-700",
  Editing: "bg-yellow-50 text-yellow-800",
  Posted: "bg-emerald-50 text-emerald-700",
  Draft: "bg-slate-100 text-slate-700",
  Ready: "bg-emerald-50 text-emerald-700",
  Scheduled: "bg-kefoo-50 text-kefoo-700",
};

export const contentPlannerCalendarStatusStyles: Record<
  string,
  { card: string; border: string }
> = {
  Idea: {
    card: "bg-kefoo-50 text-kefoo-900",
    border: "border-kefoo-200",
  },
  Scripting: {
    card: "bg-kefoo-50 text-kefoo-900",
    border: "border-kefoo-200",
  },
  Filming: {
    card: "bg-orange-50 text-orange-900",
    border: "border-orange-200",
  },
  Editing: {
    card: "bg-yellow-50 text-yellow-900",
    border: "border-yellow-200",
  },
  Posted: {
    card: "bg-emerald-50 text-emerald-900",
    border: "border-emerald-200",
  },
  Draft: {
    card: "bg-slate-50 text-slate-800",
    border: "border-slate-200",
  },
  Ready: {
    card: "bg-emerald-50 text-emerald-900",
    border: "border-emerald-200",
  },
  Scheduled: {
    card: "bg-kefoo-50 text-kefoo-900",
    border: "border-kefoo-200",
  },
};

export function getContentPlannerStatusStyle(status: string) {
  return contentPlannerStatusStyles[status] ?? "bg-slate-100 text-slate-700";
}

export function getContentPlannerCalendarStatusStyle(status: string) {
  return (
    contentPlannerCalendarStatusStyles[status] ?? {
      card: "bg-slate-50 text-slate-800",
      border: "border-slate-200",
    }
  );
}

export function formatCreatorNames(
  creatorNames: string[] | null | undefined,
): string {
  const names = (creatorNames ?? []).filter((name) => name.trim().length > 0);

  if (names.length === 0) {
    return "-";
  }

  if (names.length === 1) {
    return `👤 ${names[0]}`;
  }

  return `👥 ${names.length} creators`;
}

export function getCreatorNamesList(
  creatorNames: string[] | null | undefined,
): string[] {
  return (creatorNames ?? []).filter((name) => name.trim().length > 0);
}

export function getSelectedCreatorIds(
  creators: { id: string; name: string }[],
  creatorNames: string[] | null | undefined,
): string[] {
  const names = new Set(getCreatorNamesList(creatorNames));

  return creators.filter((creator) => names.has(creator.name)).map(
    (creator) => creator.id,
  );
}

export function getCreatorNamesFromIds(
  creators: { id: string; name: string }[],
  creatorIds: string[],
): string[] {
  const selectedIds = new Set(creatorIds);

  return creators
    .filter((creator) => selectedIds.has(creator.id))
    .map((creator) => creator.name);
}

export function normalizePlannedDate(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function formatPlannedDate(date: string | null | undefined): string {
  if (!date) {
    return "—";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPlannedDateHeading(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCalendarCreatorLine(
  creatorNames: string[] | null | undefined,
): string | null {
  const names = getCreatorNamesList(creatorNames);

  if (names.length === 0) {
    return null;
  }

  if (names.length === 1) {
    return `👤 ${names[0]}`;
  }

  if (names.length === 2) {
    return `👥 ${names[0]} + ${names[1]}`;
  }

  return `👥 ${names.slice(0, 2).join(" + ")} + ${names.length - 2} more`;
}

export function formatCalendarItemTitle(contentIdea: string) {
  const trimmed = contentIdea.trim();
  return trimmed ? `💡 ${trimmed}` : "💡 Untitled content";
}

export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type CalendarMonthCell = {
  dateKey: string | null;
  day: number | null;
  isCurrentMonth: boolean;
};

export function buildCalendarMonthGrid(
  year: number,
  month: number,
): CalendarMonthCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const cells: CalendarMonthCell[] = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push({ dateKey: null, day: null, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: toDateKey(year, month, day),
      day,
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null, isCurrentMonth: false });
  }

  return cells;
}

export function formatCalendarMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function groupItemsByDateKey(items: ContentPlannerAgency[]) {
  const groups = new Map<string, ContentPlannerAgency[]>();

  for (const item of items) {
    if (!item.planned_date) {
      continue;
    }

    const existing = groups.get(item.planned_date) ?? [];
    existing.push(item);
    groups.set(item.planned_date, existing);
  }

  for (const [dateKey, groupItems] of groups.entries()) {
    groups.set(
      dateKey,
      groupItems.sort((left, right) =>
        left.content_idea.localeCompare(right.content_idea),
      ),
    );
  }

  return groups;
}

export const CALENDAR_VISIBLE_ITEMS_PER_DAY = 2;

export function normalizeInspirationUrl(
  value: string,
): { url: string | null } | { error: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { url: null };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "Reference URL must use http or https." };
    }

    return { url: parsed.toString() };
  } catch {
    return { error: "Enter a valid reference URL." };
  }
}

export function getInspirationUrl(url: string | null | undefined) {
  return url?.trim() || null;
}

export type PlannerSummaryCounts = {
  ideaBank: number;
  inProgress: number;
  scheduled: number;
  posted: number;
};

export function getTodayDateKey(referenceDate = new Date()) {
  return toDateKey(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
}

export function getPlannerSummaryCounts(
  items: ContentPlannerAgency[],
  referenceDate = new Date(),
): PlannerSummaryCounts {
  const todayKey = getTodayDateKey(referenceDate);

  return items.reduce<PlannerSummaryCounts>(
    (counts, item) => {
      if (item.status === "Idea") {
        counts.ideaBank += 1;
      }

      if (item.status === "Scripting" || item.status === "Filming") {
        counts.inProgress += 1;
      }

      if (item.status === "Posted") {
        counts.posted += 1;
      }

      if (item.planned_date && item.planned_date > todayKey) {
        counts.scheduled += 1;
      }

      return counts;
    },
    {
      ideaBank: 0,
      inProgress: 0,
      scheduled: 0,
      posted: 0,
    },
  );
}
