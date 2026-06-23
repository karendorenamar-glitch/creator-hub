"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/plan-provider";
import { formatOrgPlanLabel } from "@/lib/plan-checkout";
import type { OrgPlan, PlanResource } from "@/lib/plan";
import { formatTrialDate, getTrialEndsInDays } from "@/lib/plan";
import { cn } from "@/lib/utils";

type UsageItem = {
  key: PlanResource;
  label: string;
  used: number;
  limit: number;
};

function getPlanUsageTitle(plan: OrgPlan) {
  if (plan === "free_trial") {
    return "Free trial limits";
  }

  return `${formatOrgPlanLabel(plan)} plan limits`;
}

function getUsageItems(
  plan: OrgPlan,
  usage: { campaigns: number; creators: number; videos: number },
  limits: { campaigns: number | null; creators: number | null; videos: number | null },
): UsageItem[] {
  const items: Array<UsageItem | null> = [
    limits.campaigns === null
      ? null
      : {
          key: "campaigns",
          label: "Campaigns",
          used: usage.campaigns,
          limit: limits.campaigns,
        },
    limits.creators === null
      ? null
      : {
          key: "creators",
          label: "Creators",
          used: usage.creators,
          limit: limits.creators,
        },
    limits.videos === null
      ? null
      : {
          key: "videos",
          label: "Tracked contents",
          used: usage.videos,
          limit: limits.videos,
        },
  ];

  return items.filter((item): item is UsageItem => item !== null);
}

function UsageMeter({ label, used, limit }: Omit<UsageItem, "key">) {
  const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const atLimit = used >= limit;
  const nearLimit = !atLimit && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            atLimit
              ? "font-semibold text-amber-800"
              : nearLimit
                ? "text-amber-700"
                : "text-slate-600",
          )}
        >
          {used}/{limit}
          {atLimit ? " · Full" : nearLimit ? " · Almost full" : ""}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atLimit
              ? "bg-amber-500"
              : nearLimit
                ? "bg-amber-400"
                : "bg-kefoo-400",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

type PlanUsageBannerProps = {
  className?: string;
  showUpgradeLink?: boolean;
};

export function PlanUsageBanner({
  className,
  showUpgradeLink = true,
}: PlanUsageBannerProps) {
  const { plan, limits, usage, isTrialExpired, isFreeTrial, trialEndsAt } =
    usePlan();

  if (isTrialExpired) {
    return null;
  }

  const items = getUsageItems(plan, usage, limits);
  const daysLeft = isFreeTrial ? getTrialEndsInDays(trialEndsAt) : null;

  if (items.length === 0) {
    return null;
  }

  const showMonthlyHint = plan === "starter" || plan === "growth" || plan === "scale";

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border border-kefoo-200 bg-kefoo-50 px-4 py-4 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-kefoo-900">
            {getPlanUsageTitle(plan)}
          </p>
          {isFreeTrial && trialEndsAt && daysLeft !== null ? (
            <p className="mt-1 text-xs text-kefoo-800">
              {daysLeft === 0
                ? "Trial ends today"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · ends ${formatTrialDate(trialEndsAt)}`}
            </p>
          ) : showMonthlyHint ? (
            <p className="mt-1 text-xs text-kefoo-800">Monthly allowance</p>
          ) : null}
        </div>
        {showUpgradeLink && (isFreeTrial || plan === "starter") ? (
          <Link
            href={plan === "starter" ? "/checkout/growth" : "/checkout/starter"}
            className="text-xs font-medium text-kefoo-700 underline-offset-2 hover:text-kefoo-600 hover:underline"
          >
            {plan === "starter" ? "Upgrade to Growth" : "Upgrade plan"}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <UsageMeter
            key={item.key}
            label={item.label}
            used={item.used}
            limit={item.limit}
          />
        ))}
      </div>
    </div>
  );
}
