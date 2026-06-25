"use client";

import { PlanUsageBanner } from "@/components/plan/plan-usage-banner";
import { usePlan } from "@/components/plan/plan-provider";

export function DashboardPlanUsage() {
  const { plan, isAccessLocked } = usePlan();

  if (isAccessLocked) {
    return null;
  }

  if (plan !== "starter") {
    return null;
  }

  return <PlanUsageBanner />;
}
