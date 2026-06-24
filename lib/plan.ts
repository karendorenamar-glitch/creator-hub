import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import { defaultTrialEndsAt } from "@/lib/org-plan-schema";

export type OrgPlan = "free_trial" | "starter" | "growth" | "scale";

const ORG_PLANS: OrgPlan[] = ["free_trial", "starter", "growth", "scale"];

export function normalizeOrgPlan(value: string | null | undefined): OrgPlan {
  const normalized = value?.trim().toLowerCase();

  if (normalized && ORG_PLANS.includes(normalized as OrgPlan)) {
    return normalized as OrgPlan;
  }

  return "free_trial";
}

export type PlanResource = "campaigns" | "creators" | "videos";

export type PlanLimits = {
  campaigns: number | null;
  creators: number | null;
  videos: number | null;
  members: number;
};

export type OrgUsage = {
  campaigns: number;
  creators: number;
  videos: number;
};

export type PlanContext = {
  plan: OrgPlan;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  isFreeTrial: boolean;
  isTrialExpired: boolean;
  limits: PlanLimits;
  usage: OrgUsage;
};

export const PLAN_LIMITS: Record<OrgPlan, PlanLimits> = {
  free_trial: { campaigns: 3, creators: 10, videos: 15, members: 1 },
  starter: { campaigns: 10, creators: 30, videos: 60, members: 1 },
  growth: { campaigns: null, creators: 100, videos: 300, members: 3 },
  scale: { campaigns: null, creators: 500, videos: 1500, members: 5 },
};

export const FREE_TRIAL_ALLOWED_PREFIXES = [
  "/campaigns",
  "/creators",
  "/videos",
  "/settings",
  "/checkout",
];

export const FREE_TRIAL_LOCKED_NAV_HREFS = [
  "/dashboard",
  ...(CONTENT_PLANNER_ENABLED ? ["/planner"] : []),
  "/payouts",
];

export const UPGRADE_PLAN_MESSAGE = "Upgrade your plan to use this feature.";

export const FREE_TRIAL_EXPIRED_MESSAGE =
  "Your free trial has ended. Upgrade your plan to continue using Kefoo.";

export function getDefaultAppPath(
  plan: OrgPlan,
  isTrialExpired = false,
) {
  if (isFreeTrialPlan(plan) || isTrialExpired || plan === "starter") {
    return "/campaigns";
  }

  return "/dashboard";
}

export function isNavLockedOnFreeTrial(href: string) {
  return FREE_TRIAL_LOCKED_NAV_HREFS.includes(href);
}

export function isFreeTrialPlan(plan: OrgPlan) {
  return plan === "free_trial";
}

export function resolveTrialEndsAt(
  plan: OrgPlan,
  trialEndsAt: string | null | undefined,
  trialStartedAt?: string | null,
) {
  if (!isFreeTrialPlan(plan)) {
    return trialEndsAt ?? null;
  }

  if (trialEndsAt) {
    return trialEndsAt;
  }

  if (trialStartedAt) {
    return defaultTrialEndsAt(trialStartedAt);
  }

  return null;
}

export function isTrialExpired(
  plan: OrgPlan,
  trialEndsAt: string | null | undefined,
  trialStartedAt?: string | null,
) {
  const resolvedEndsAt = resolveTrialEndsAt(plan, trialEndsAt, trialStartedAt);

  if (!isFreeTrialPlan(plan) || !resolvedEndsAt) {
    return false;
  }

  return new Date(resolvedEndsAt).getTime() < Date.now();
}

export function formatTrialDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isPathAllowedOnFreeTrial(pathname: string) {
  return FREE_TRIAL_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getPlanLimit(plan: OrgPlan, resource: PlanResource) {
  return PLAN_LIMITS[plan][resource];
}

export function getPlanMemberLimit(plan: OrgPlan) {
  return PLAN_LIMITS[plan].members;
}

export function formatPlanLimitMessage(
  resource: PlanResource,
  limit: number,
  plan: OrgPlan = "free_trial",
) {
  const label =
    resource === "campaigns"
      ? "campaigns"
      : resource === "creators"
        ? "creators"
        : "videos";

  if (plan === "free_trial") {
    return `Free trial limit reached: max ${limit} ${label}. Upgrade your plan to add more.`;
  }

  return `Plan limit reached: max ${limit} ${label}. Upgrade your plan to add more.`;
}

export function getTrialEndsInDays(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) {
    return null;
  }

  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
