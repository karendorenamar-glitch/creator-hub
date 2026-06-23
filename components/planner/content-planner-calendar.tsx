"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildCalendarMonthGrid,
  CALENDAR_VISIBLE_ITEMS_PER_DAY,
  formatCalendarCreatorLine,
  formatCalendarItemTitle,
  formatCalendarMonthLabel,
  getContentPlannerCalendarStatusStyle,
  groupItemsByDateKey,
  toDateKey,
} from "@/lib/content-planner";
import { cn } from "@/lib/utils";
import type { ContentPlannerAgency } from "@/types/database";

type ContentPlannerCalendarProps = {
  items: ContentPlannerAgency[];
  onViewDetails: (item: ContentPlannerAgency) => void;
  onAddContent: (plannedDate: string) => void;
  hideAddButton?: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarEventCard({
  item,
  onViewDetails,
}: {
  item: ContentPlannerAgency;
  onViewDetails: (item: ContentPlannerAgency) => void;
}) {
  const statusStyle = getContentPlannerCalendarStatusStyle(item.status);
  const creatorLine = formatCalendarCreatorLine(item.creator_names);

  return (
    <button
      type="button"
      onClick={() => onViewDetails(item)}
      className={cn(
        "w-full rounded-md border px-2 py-1.5 text-left transition-colors hover:brightness-[0.98]",
        statusStyle.card,
        statusStyle.border,
      )}
    >
      <p className="line-clamp-2 text-[11px] font-medium leading-snug sm:text-xs">
        {formatCalendarItemTitle(item.content_idea)}
      </p>
      {creatorLine && (
        <p className="mt-1 truncate text-[10px] leading-snug opacity-80 sm:text-[11px]">
          {creatorLine}
        </p>
      )}
    </button>
  );
}

function CalendarDayCell({
  dateKey,
  day,
  isCurrentMonth,
  items,
  isToday,
  onViewDetails,
  onAddContent,
  hideAddButton = false,
}: {
  dateKey: string | null;
  day: number | null;
  isCurrentMonth: boolean;
  items: ContentPlannerAgency[];
  isToday: boolean;
  onViewDetails: (item: ContentPlannerAgency) => void;
  onAddContent: (plannedDate: string) => void;
  hideAddButton?: boolean;
}) {
  const visibleItems = items.slice(0, CALENDAR_VISIBLE_ITEMS_PER_DAY);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div
      className={cn(
        "group relative min-h-28 border-b border-r border-slate-200 bg-white p-1.5 sm:min-h-36 sm:p-2",
        !isCurrentMonth && "bg-slate-50/80",
      )}
    >
      {day != null && dateKey && isCurrentMonth && (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-1">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
                isToday
                  ? "bg-kefoo-400 text-white"
                  : "text-slate-700",
              )}
            >
              {day}
            </span>
            {!hideAddButton && (
              <button
                type="button"
                onClick={() => onAddContent(dateKey)}
                className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 opacity-0 shadow-sm transition-all hover:border-kefoo-200 hover:bg-kefoo-50 hover:text-kefoo-600 group-hover:opacity-100 group-focus-within:opacity-100 sm:p-1.5"
                aria-label={`Add content for ${dateKey}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {visibleItems.map((item) => (
              <CalendarEventCard
                key={item.id}
                item={item}
                onViewDetails={onViewDetails}
              />
            ))}

            {hiddenCount > 0 && (
              <p className="px-1 text-[10px] font-medium text-slate-500 sm:text-xs">
                +{hiddenCount} more
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ContentPlannerCalendar({
  items,
  onViewDetails,
  onAddContent,
  hideAddButton = false,
}: ContentPlannerCalendarProps) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const itemsByDate = useMemo(() => groupItemsByDateKey(items), [items]);
  const monthGrid = useMemo(
    () => buildCalendarMonthGrid(visibleMonth.year, visibleMonth.month),
    [visibleMonth.year, visibleMonth.month],
  );
  const todayKey = toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  function goToPreviousMonth() {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month - 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function goToNextMonth() {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month + 1, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function goToToday() {
    setVisibleMonth({
      year: today.getFullYear(),
      month: today.getMonth(),
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[10rem] text-center text-base font-semibold text-slate-900 sm:min-w-[12rem] sm:text-lg">
            {formatCalendarMonthLabel(visibleMonth.year, visibleMonth.month)}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:self-auto"
        >
          Today
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="border-r border-slate-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 last:border-r-0 sm:text-xs"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-slate-200">
            {monthGrid.map((cell, index) => (
              <CalendarDayCell
                key={`${cell.dateKey ?? "empty"}-${index}`}
                dateKey={cell.dateKey}
                day={cell.day}
                isCurrentMonth={cell.isCurrentMonth}
                items={
                  cell.dateKey ? (itemsByDate.get(cell.dateKey) ?? []) : []
                }
                isToday={cell.dateKey === todayKey}
                onViewDetails={onViewDetails}
                onAddContent={onAddContent}
                hideAddButton={hideAddButton}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
