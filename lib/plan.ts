import { CONTENT_PLANNER_ENABLED } from "@/lib/features";

export type OrgPlan = "free_trial" | "starter" | "growth" | "scale";

export type PlanResource = "campaigns" | "creators" | "videos";

export type PlanLimits = {
  campaigns: number | null;
  creators: number | null;
  videos: number | null;
};

export type OrgUsage = {
  campaigns: number;
  creators: number;
  videos: number;
};

export type PlanContext = {
  plan: OrgPlan;
  trialEndsAt: string | null;
  isFreeTrial: boolean;
  isTrialExpired: boolean;
  limits: PlanLimits;
  usage: OrgUsage;
};

export const PLAN_LIMITS: Record<OrgPlan, PlanLimits> = {
  free_trial: { campaigns: 3, creators: 10, videos: 15 },
  starter: { campaigns: 10, creators: 30, videos: 60 },
  growth: { campaigns: null, creators: 100, videos: 300 },
  scale: { campaigns: null, creators: 500, videos: 1500 },
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

export function isTrialExpired(
  plan: OrgPlan,
  trialEndsAt: string | null | undefined,
) {
  if (!isFreeTrialPlan(plan) || !trialEndsAt) {
    return false;
  }

  return new Date(trialEndsAt).getTime() < Date.now();
}

export function isPathAllowedOnFreeTrial(pathname: string) {
  return FREE_TRIAL_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getPlanLimit(plan: OrgPlan, resource: PlanResource) {
  return PLAN_LIMITS[plan][resource];
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
