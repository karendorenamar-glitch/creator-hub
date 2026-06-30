import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import type { OrgPlan } from "@/lib/plan";
import {
  isFreeTrialPlan,
  isPathAllowedOnFreeTrial,
  normalizeOrgPlan,
} from "@/lib/plan";
import type { CheckoutPlan } from "@/lib/plan-checkout";

export type PlanFeature =
  | "dashboard"
  | "dashboard_advanced"
  | "bulk_upload"
  | "discover_keywords"
  | "payouts"
  | "content_planner"
  | "export_csv";

export type DashboardTier = "none" | "scale";

const PLAN_RANK: Record<OrgPlan, number> = {
  free_trial: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

const FEATURE_MIN_PLAN: Record<PlanFeature, OrgPlan> = {
  dashboard: "scale",
  dashboard_advanced: "scale",
  bulk_upload: "starter",
  discover_keywords: "scale",
  payouts: "scale",
  content_planner: "scale",
  export_csv: "scale",
};

export const FEATURE_UPGRADE_MESSAGES: Record<PlanFeature, string> = {
  dashboard:
    "Scale unlocks the performance dashboard — campaign metrics in one view.",
  dashboard_advanced:
    "Scale adds creator comparisons, live insights, and monthly trend tracking.",
  bulk_upload:
    "Starter lets you paste multiple video links and import them in one go.",
  discover_keywords:
    "Scale unlocks keyword scan — find matching videos from creator profiles (1 scan per week).",
  payouts: "Scale adds payout tracking with due dates and payment status.",
  content_planner:
    "Scale unlocks Content Planner for pillars, ideas, and publish dates.",
  export_csv:
    "Scale lets you export campaign and dashboard performance data as CSV.",
};

export function hasPlanFeature(
  plan: OrgPlan | string,
  feature: PlanFeature,
  addOnFeatures: PlanFeature[] = [],
): boolean {
  if (feature === "content_planner" && !CONTENT_PLANNER_ENABLED) {
    return false;
  }

  if (addOnFeatures.includes(feature)) {
    return true;
  }

  const normalizedPlan = normalizeOrgPlan(plan);

  return PLAN_RANK[normalizedPlan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function getRequiredCheckoutPlan(feature: PlanFeature): CheckoutPlan {
  const minPlan = FEATURE_MIN_PLAN[feature];
  return minPlan === "growth" ? "scale" : (minPlan as CheckoutPlan);
}

export function getNavUpgradeCheckoutPlan(href: string): CheckoutPlan {
  if (href === "/payouts" || href === "/planner" || href === "/dashboard") {
    return "scale";
  }

  return "scale";
}

export function getDashboardTier(
  plan: OrgPlan,
  addOnFeatures: PlanFeature[] = [],
): DashboardTier {
  if (!hasPlanFeature(plan, "dashboard", addOnFeatures)) {
    return "none";
  }

  return "scale";
}

export function getDashboardDescription(tier: DashboardTier) {
  switch (tier) {
    case "scale":
      return "Creator comparisons, live insights, monthly trends, payouts, and cross-campaign reporting.";
    default:
      return "Compare campaigns and creators to decide where to invest next.";
  }
}

export function isPathAllowedForPlan(
  plan: OrgPlan,
  pathname: string,
  isAccessLocked: boolean,
  addOnFeatures: PlanFeature[] = [],
) {
  if (isAccessLocked) {
    return (
      pathname.startsWith("/settings") || pathname.startsWith("/checkout")
    );
  }

  if (isFreeTrialPlan(plan)) {
    return isPathAllowedOnFreeTrial(pathname);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return hasPlanFeature(plan, "dashboard", addOnFeatures);
  }

  if (pathname === "/payouts" || pathname.startsWith("/payouts/")) {
    return hasPlanFeature(plan, "payouts", addOnFeatures);
  }

  if (pathname === "/planner" || pathname.startsWith("/planner/")) {
    return hasPlanFeature(plan, "content_planner", addOnFeatures);
  }

  return true;
}

export function isNavHrefLocked(
  plan: OrgPlan,
  href: string,
  isAccessLocked: boolean,
  addOnFeatures: PlanFeature[] = [],
) {
  return !isPathAllowedForPlan(plan, href, isAccessLocked, addOnFeatures);
}
