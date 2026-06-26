"use server";

import { getActiveOrgId } from "@/lib/org";
import { getPlanContext } from "@/lib/plan-enforcement";
import { PLAN_LIMITS, type PlanContext } from "@/lib/plan";

function createFallbackPlanContext(): PlanContext {
  return {
    plan: "free_trial",
    trialStartedAt: null,
    trialEndsAt: null,
    isFreeTrial: true,
    isTrialExpired: false,
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
    isSubscriptionExpired: false,
    isAccessLocked: false,
    limits: PLAN_LIMITS.free_trial,
    usage: { campaigns: 0, creators: 0, videos: 0 },
    addOns: [],
    addOnFeatures: [],
  };
}

export async function getDashboardPlanContext(): Promise<PlanContext> {
  const orgId = await getActiveOrgId();

  if (!orgId) {
    return createFallbackPlanContext();
  }

  const context = await getPlanContext(orgId);

  if (!context) {
    return createFallbackPlanContext();
  }

  return context;
}
