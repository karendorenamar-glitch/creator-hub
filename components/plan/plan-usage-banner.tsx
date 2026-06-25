"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/plan-provider";
import { formatOrgPlanLabel } from "@/lib/plan-checkout";
import type { OrgPlan, PlanResource } from "@/lib/plan";
import { formatTrialDate, getDaysUntilDate, getTrialEndsInDays } from "@/lib/plan";
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
          label: "Videos",
          used: usage.videos,
          limit: limits.videos,
        },
  ];

  return items.filter((item): item is UsageItem => item !== null);
}

function UsageMeter({ label, used, limit }: Omit<UsageItem, "key">) {
  const remaining = Math.max(limit - used, 0);
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
          {remaining} tersisa · {used}/{limit}
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
  const {
    plan,
    limits,
    usage,
    isAccessLocked,
    isFreeTrial,
    trialEndsAt,
    subscriptionEndsAt,
  } = usePlan();

  if (isAccessLocked) {
    return null;
  }

  const items = getUsageItems(plan, usage, limits);
  const daysLeft = isFreeTrial
    ? getTrialEndsInDays(trialEndsAt)
    : getDaysUntilDate(subscriptionEndsAt);
  const periodEndsAt = isFreeTrial ? trialEndsAt : subscriptionEndsAt;

  if (items.length === 0) {
    return null;
  }

  const showMonthlyHint = plan === "starter" || plan === "growth" || plan === "scale";
  const upgradeHref =
    plan === "free_trial"
      ? "/checkout/starter"
      : plan === "starter"
        ? "/checkout/growth"
        : plan === "growth"
          ? "/checkout/scale"
          : subscriptionEndsAt
            ? `/checkout/${plan}`
            : null;

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
          {periodEndsAt && daysLeft !== null ? (
            <p className="mt-1 text-xs text-kefoo-800">
              {daysLeft === 0
                ? isFreeTrial
                  ? "Trial ends today"
                  : "Subscription ends today"
                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · ends ${formatTrialDate(periodEndsAt)}`}
            </p>
          ) : showMonthlyHint ? (
            <p className="mt-1 text-xs text-kefoo-800">Monthly subscription</p>
          ) : null}
        </div>
        {showUpgradeLink && upgradeHref ? (
          <Link
            href={upgradeHref}
            className="text-xs font-medium text-kefoo-700 underline-offset-2 hover:text-kefoo-600 hover:underline"
          >
            {plan === "starter"
              ? "Upgrade to Growth"
              : plan === "growth"
                ? "Upgrade to Scale"
                : plan === "scale"
                  ? "Renew subscription"
                  : "Upgrade plan"}
          </Link>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 grid gap-4",
          items.length === 1
            ? "grid-cols-1"
            : items.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-3",
        )}
      >
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
