"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  DASHBOARD_PLATFORMS,
  formatMonthLabel,
  type DashboardMonthValue,
  type DashboardPlatformValue,
} from "@/lib/dashboard-month-filter";

type DashboardFiltersProps = {
  selectedMonth: DashboardMonthValue;
  selectedPlatform: DashboardPlatformValue;
  currentMonth: DashboardMonthValue;
  previousMonths: DashboardMonthValue[];
};

export function DashboardFilters({
  selectedMonth,
  selectedPlatform,
  currentMonth,
  previousMonths,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(updates: {
    month?: DashboardMonthValue;
    platform?: DashboardPlatformValue;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextMonth = updates.month ?? selectedMonth;
    const nextPlatform = updates.platform ?? selectedPlatform;

    if (nextMonth === currentMonth) {
      params.delete("month");
    } else {
      params.set("month", nextMonth);
    }

    if (nextPlatform === "all") {
      params.delete("platform");
    } else {
      params.set("platform", nextPlatform.toLowerCase());
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/");
    });
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="dashboard-month-filter"
          className="text-sm font-medium text-slate-700"
        >
          Month
        </label>
        <select
          id="dashboard-month-filter"
          value={selectedMonth}
          onChange={(event) =>
            updateFilters({ month: event.target.value as DashboardMonthValue })
          }
          disabled={isPending}
          className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2 disabled:opacity-60"
        >
          <optgroup label="Current Month">
            <option value={currentMonth}>
              {formatMonthLabel(currentMonth)} (Current)
            </option>
          </optgroup>

          {previousMonths.length > 0 && (
            <optgroup label="Previous Months">
              {previousMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="All Time">
            <option value="all">All Time</option>
          </optgroup>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="dashboard-platform-filter"
          className="text-sm font-medium text-slate-700"
        >
          Platform
        </label>
        <select
          id="dashboard-platform-filter"
          value={selectedPlatform}
          onChange={(event) =>
            updateFilters({
              platform: event.target.value as DashboardPlatformValue,
            })
          }
          disabled={isPending}
          className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2 disabled:opacity-60"
        >
          <option value="all">All</option>
          {DASHBOARD_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      {isPending && (
        <span className="pb-2.5 text-sm text-slate-400">Updating...</span>
      )}
    </div>
  );
}
