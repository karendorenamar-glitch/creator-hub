import type { PlanFeature } from "@/lib/plan-features";
import type { OrgPlan, PlanLimits } from "@/lib/plan";
import { PLAN_LIMITS } from "@/lib/plan";
import { getDefaultMemberLimitForPlan } from "@/lib/org-team";

export const ORG_ADD_ON_TYPES = [
  "additional_user",
  "content_planner",
  "additional_creators",
  "additional_tracked_contents",
  "advanced_dashboard",
  "payout_tracking",
] as const;

export type OrgAddOnType = (typeof ORG_ADD_ON_TYPES)[number];

export type OrgAddOnStatus = "active" | "cancelled";

export type OrgAddOnRecord = {
  id: string;
  org_id: string;
  add_on_type: OrgAddOnType;
  quantity: number;
  status: OrgAddOnStatus;
  notes: string | null;
  created_at: string;
  cancelled_at: string | null;
};

export const ADD_ON_BONUSES: Record<
  OrgAddOnType,
  { members?: number; creators?: number; videos?: number; features?: PlanFeature[] }
> = {
  additional_user: { members: 1 },
  content_planner: { features: ["content_planner"] },
  additional_creators: { creators: 50 },
  additional_tracked_contents: { videos: 100 },
  advanced_dashboard: { features: ["dashboard", "dashboard_advanced"] },
  payout_tracking: { features: ["payouts"] },
};

export function isOrgAddOnType(value: string): value is OrgAddOnType {
  return ORG_ADD_ON_TYPES.includes(value as OrgAddOnType);
}

export function getActiveOrgAddOns(addOns: OrgAddOnRecord[]) {
  return addOns.filter((addOn) => addOn.status === "active");
}

export function sumAddOnBonuses(addOns: OrgAddOnRecord[]) {
  const active = getActiveOrgAddOns(addOns);

  return active.reduce(
    (totals, addOn) => {
      const bonus = ADD_ON_BONUSES[addOn.add_on_type];
      const quantity = Math.max(1, addOn.quantity);

      if (bonus.members) {
        totals.members += bonus.members * quantity;
      }

      if (bonus.creators) {
        totals.creators += bonus.creators * quantity;
      }

      if (bonus.videos) {
        totals.videos += bonus.videos * quantity;
      }

      for (const feature of bonus.features ?? []) {
        totals.features.add(feature);
      }

      return totals;
    },
    {
      members: 0,
      creators: 0,
      videos: 0,
      features: new Set<PlanFeature>(),
    },
  );
}

export function resolveAddOnFeatures(addOns: OrgAddOnRecord[]): PlanFeature[] {
  return [...sumAddOnBonuses(addOns).features];
}

export function resolveEffectiveLimits(
  plan: OrgPlan,
  memberLimit: number | null | undefined,
  addOns: OrgAddOnRecord[],
): PlanLimits {
  const base = PLAN_LIMITS[plan];
  const bonuses = sumAddOnBonuses(addOns);
  const baseMembers =
    typeof memberLimit === "number" && memberLimit > 0
      ? memberLimit
      : getDefaultMemberLimitForPlan(plan);

  return {
    campaigns: base.campaigns,
    creators:
      base.creators === null ? null : base.creators + bonuses.creators,
    videos: base.videos === null ? null : base.videos + bonuses.videos,
    members: baseMembers + bonuses.members,
  };
}

export function planAllowsTeamInvitesWithAddOns(
  plan: OrgPlan,
  addOns: OrgAddOnRecord[],
) {
  if (plan === "scale") {
    return true;
  }

  return sumAddOnBonuses(addOns).members > 0;
}
