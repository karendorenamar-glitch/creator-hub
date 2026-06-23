import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import type { OrgPlan } from "@/lib/plan";
import { isFreeTrialPlan, isPathAllowedOnFreeTrial } from "@/lib/plan";
import type { CheckoutPlan } from "@/lib/plan-checkout";

export type PlanFeature =
  | "dashboard"
  | "dashboard_advanced"
  | "bulk_upload"
  | "payouts"
  | "content_planner";

export type DashboardTier = "none" | "starter" | "growth" | "scale";

const PLAN_RANK: Record<OrgPlan, number> = {
  free_trial: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

const FEATURE_MIN_PLAN: Record<PlanFeature, OrgPlan> = {
  dashboard: "growth",
  dashboard_advanced: "growth",
  bulk_upload: "growth",
  payouts: "scale",
  content_planner: "scale",
};

export const FEATURE_UPGRADE_MESSAGES: Record<PlanFeature, string> = {
  dashboard: "Upgrade to Growth to unlock the dashboard.",
  dashboard_advanced:
    "Upgrade to Growth for advanced performance insights and creator comparisons.",
  bulk_upload: "Upgrade to Growth to use bulk video upload.",
  payouts: "Upgrade to Scale to manage creator payouts.",
  content_planner: "Upgrade to Scale to use Content Planner.",
};

export function hasPlanFeature(plan: OrgPlan, feature: PlanFeature): boolean {
  if (feature === "content_planner" && !CONTENT_PLANNER_ENABLED) {
    return false;
  }

  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function getRequiredCheckoutPlan(feature: PlanFeature): CheckoutPlan {
  return FEATURE_MIN_PLAN[feature] as CheckoutPlan;
}

export function getDashboardTier(plan: OrgPlan): DashboardTier {
  if (!hasPlanFeature(plan, "dashboard")) {
    return "none";
  }

  if (hasPlanFeature(plan, "payouts")) {
    return "scale";
  }

  if (hasPlanFeature(plan, "dashboard_advanced")) {
    return "growth";
  }

  return "growth";
}

export function getDashboardDescription(tier: DashboardTier) {
  switch (tier) {
    case "starter":
      return "Basic campaign analytics across your active campaigns.";
    case "growth":
      return "Advanced performance insights across campaigns and creators.";
    case "scale":
      return "Full intelligence workspace with payouts and cross-campaign reporting.";
    default:
      return "Compare campaigns and creators to guide your next move.";
  }
}

export function isPathAllowedForPlan(
  plan: OrgPlan,
  pathname: string,
  isTrialExpired: boolean,
) {
  if (isFreeTrialPlan(plan)) {
    if (isTrialExpired) {
      return (
        pathname.startsWith("/settings") || pathname.startsWith("/checkout")
      );
    }

    return isPathAllowedOnFreeTrial(pathname);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return hasPlanFeature(plan, "dashboard");
  }

  if (pathname === "/payouts" || pathname.startsWith("/payouts/")) {
    return hasPlanFeature(plan, "payouts");
  }

  if (pathname === "/planner" || pathname.startsWith("/planner/")) {
    return hasPlanFeature(plan, "content_planner");
  }

  return true;
}

export function isNavHrefLocked(
  plan: OrgPlan,
  href: string,
  isTrialExpired: boolean,
) {
  return !isPathAllowedForPlan(plan, href, isTrialExpired);
}
