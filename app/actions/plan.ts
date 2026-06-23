"use server";

import { getActiveOrgId } from "@/lib/org";
import { getPlanContext } from "@/lib/plan-enforcement";
import { PLAN_LIMITS, type PlanContext } from "@/lib/plan";

export async function getDashboardPlanContext(): Promise<PlanContext> {
  const orgId = await getActiveOrgId();

  if (!orgId) {
    return {
      plan: "free_trial",
      trialEndsAt: null,
      isFreeTrial: true,
      isTrialExpired: false,
      limits: PLAN_LIMITS.free_trial,
      usage: { campaigns: 0, creators: 0, videos: 0 },
    };
  }

  const context = await getPlanContext(orgId);

  if (!context) {
    return {
      plan: "free_trial",
      trialEndsAt: null,
      isFreeTrial: true,
      isTrialExpired: false,
      limits: PLAN_LIMITS.free_trial,
      usage: { campaigns: 0, creators: 0, videos: 0 },
    };
  }

  return context;
}
