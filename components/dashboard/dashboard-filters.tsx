"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DASHBOARD_PLATFORMS,
  MAX_DASHBOARD_COMPARE_MONTHS,
  formatMonthLabel,
  type DashboardMonthValue,
  type DashboardPlatformValue,
} from "@/lib/dashboard-month-filter";
import { cn } from "@/lib/utils";

type DashboardCampaignOption = {
  id: string;
  name: string;
};

type DashboardTeamOption = {
  id: string;
  label: string;
};

type DashboardFiltersProps = {
  selectedMonths: DashboardMonthValue[];
  selectedPlatform: DashboardPlatformValue;
  selectedCampaigns: string[];
  selectedTeam: string;
  campaigns: DashboardCampaignOption[];
  campaignsNote?: string;
  teamMembers: DashboardTeamOption[];
  showTeamFilter: boolean;
  availableMonths: DashboardMonthValue[];
  currentMonth: DashboardMonthValue;
};

type MultiSelectDropdownProps = {
  id: string;
  label: string;
  summary: string;
  disabled?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function MultiSelectDropdown({
  id,
  label,
  summary,
  disabled = false,
  children,
  footer,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-w-[220px] items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 outline-none ring-kefoo-500 focus:border-kefoo-500 focus:ring-2 disabled:opacity-60",
          open && "border-kefoo-500 ring-2 ring-kefoo-500/20",
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="max-h-56 space-y-2 overflow-y-auto">{children}</div>
          {footer ? (
            <div className="mt-3 border-t border-slate-100 pt-3">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getMonthsSummary(
  selectedMonths: DashboardMonthValue[],
  currentMonth: DashboardMonthValue,
) {
  if (selectedMonths.length === 0) {
    return formatMonthLabel(currentMonth);
  }

  if (selectedMonths.length === 1) {
    const month = selectedMonths[0];
    return month === currentMonth
      ? `${formatMonthLabel(month)} (Current)`
      : formatMonthLabel(month);
  }

  return selectedMonths.map((month) => formatMonthLabel(month)).join(", ");
}

function getCampaignsSummary(
  selectedCampaigns: string[],
  campaigns: DashboardCampaignOption[],
) {
  if (selectedCampaigns.length === 0) {
    return "All campaigns";
  }

  if (selectedCampaigns.length === 1) {
    return (
      campaigns.find((campaign) => campaign.id === selectedCampaigns[0])?.name ??
      "1 campaign"
    );
  }

  return `${selectedCampaigns.length} campaigns selected`;
}

export function DashboardFilters({
  selectedMonths,
  selectedPlatform,
  selectedCampaigns,
  selectedTeam,
  campaigns,
  campaignsNote,
  teamMembers,
  showTeamFilter,
  availableMonths,
  currentMonth,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(updates: {
    months?: DashboardMonthValue[];
    platform?: DashboardPlatformValue;
    campaigns?: string[];
    team?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextMonths = updates.months ?? selectedMonths;
    const nextPlatform = updates.platform ?? selectedPlatform;
    const nextCampaigns = updates.campaigns ?? selectedCampaigns;
    const nextTeam = updates.team ?? selectedTeam;

    params.delete("month");
    params.delete("campaign");

    if (nextMonths.length === 1 && nextMonths[0] === currentMonth) {
      params.delete("months");
    } else {
      params.set("months", nextMonths.join(","));
    }

    if (nextPlatform === "all") {
      params.delete("platform");
    } else {
      params.set("platform", nextPlatform.toLowerCase());
    }

    if (nextCampaigns.length === 0) {
      params.delete("campaigns");
    } else {
      params.set("campaigns", nextCampaigns.join(","));
    }

    if (nextTeam === "all") {
      params.delete("team");
    } else {
      params.set("team", nextTeam);
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `/dashboard?${query}` : "/dashboard");
    });
  }

  function toggleMonth(month: DashboardMonthValue) {
    const isSelected = selectedMonths.includes(month);

    if (isSelected) {
      const next = selectedMonths.filter((value) => value !== month);
      updateFilters({ months: next.length > 0 ? next : [currentMonth] });
      return;
    }

    if (selectedMonths.length >= MAX_DASHBOARD_COMPARE_MONTHS) {
      return;
    }

    updateFilters({ months: [...selectedMonths, month] });
  }

  function toggleCampaign(campaignId: string) {
    const next = selectedCampaigns.includes(campaignId)
      ? selectedCampaigns.filter((id) => id !== campaignId)
      : [...selectedCampaigns, campaignId];

    updateFilters({ campaigns: next });
  }

  function clearCampaigns() {
    updateFilters({ campaigns: [] });
  }

  const selectClassName =
    "min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-kefoo-500 focus:border-kefoo-500 focus:ring-2 disabled:opacity-60";

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <MultiSelectDropdown
        id="dashboard-months-filter"
        label="Months"
        summary={getMonthsSummary(selectedMonths, currentMonth)}
        disabled={isPending}
      >
        <p className="px-1 pb-1 text-xs text-slate-500">
          Select up to {MAX_DASHBOARD_COMPARE_MONTHS} months
        </p>
        {availableMonths.map((month) => {
          const checked = selectedMonths.includes(month);
          const disabled =
            isPending ||
            (!checked && selectedMonths.length >= MAX_DASHBOARD_COMPARE_MONTHS);

          return (
            <label
              key={month}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50",
                disabled && !checked && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleMonth(month)}
                className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
              />
              <span>
                {formatMonthLabel(month)}
                {month === currentMonth ? " (Current)" : ""}
              </span>
            </label>
          );
        })}
      </MultiSelectDropdown>

      <MultiSelectDropdown
        id="dashboard-campaigns-filter"
        label="Campaigns"
        summary={getCampaignsSummary(selectedCampaigns, campaigns)}
        disabled={isPending}
        footer={
          selectedCampaigns.length > 0 ? (
            <button
              type="button"
              onClick={clearCampaigns}
              disabled={isPending}
              className="text-xs font-medium text-kefoo-700 hover:text-kefoo-600 disabled:opacity-60"
            >
              Clear selection
            </button>
          ) : null
        }
      >
        {campaignsNote ? (
          <p className="px-1 pb-2 text-xs text-slate-500">{campaignsNote}</p>
        ) : null}
        {campaigns.length === 0 ? (
          <p className="px-1 text-sm text-slate-500">No active or completed campaigns yet.</p>
        ) : (
          campaigns.map((campaign) => (
            <label
              key={campaign.id}
              className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedCampaigns.includes(campaign.id)}
                disabled={isPending}
                onChange={() => toggleCampaign(campaign.id)}
                className="mt-0.5 rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
              />
              <span>{campaign.name}</span>
            </label>
          ))
        )}
      </MultiSelectDropdown>

      {showTeamFilter ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="dashboard-team-filter"
            className="text-sm font-medium text-slate-700"
          >
            Team
          </label>
          <select
            id="dashboard-team-filter"
            value={selectedTeam}
            onChange={(event) => updateFilters({ team: event.target.value })}
            disabled={isPending}
            className={selectClassName}
          >
            <option value="all">All Team</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
          className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-kefoo-500 focus:border-kefoo-500 focus:ring-2 disabled:opacity-60"
        >
          <option value="all">All</option>
          {DASHBOARD_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <span className="pb-2.5 text-sm text-slate-400">Updating...</span>
      ) : null}
    </div>
  );
}
