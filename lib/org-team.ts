import type { OrgMemberRole, OrgPlan } from "@/types/database";

export type OrgMemberRoleValue = OrgMemberRole;

export function normalizeOrgMemberRole(role: string): OrgMemberRole {
  if (role === "owner") {
    return "leader";
  }

  if (role === "member") {
    return "team";
  }

  if (role === "leader" || role === "team") {
    return role;
  }

  return "team";
}

export function isLeaderRole(role: string) {
  return normalizeOrgMemberRole(role) === "leader";
}

export function planAllowsTeamInvites(plan: OrgPlan) {
  return plan === "growth" || plan === "scale";
}

export function getDefaultMemberLimitForPlan(plan: OrgPlan) {
  switch (plan) {
    case "growth":
      return 3;
    case "scale":
      return 5;
    default:
      return 1;
  }
}

export function resolveMemberLimit(
  plan: OrgPlan,
  memberLimit: number | null | undefined,
) {
  if (typeof memberLimit === "number" && memberLimit > 0) {
    return memberLimit;
  }

  return getDefaultMemberLimitForPlan(plan);
}

export function canEditCampaign(params: {
  role: OrgMemberRole;
  userId: string;
  createdBy: string | null;
}) {
  if (params.role === "leader") {
    return true;
  }

  if (!params.createdBy) {
    return true;
  }

  return params.createdBy === params.userId;
}

export function canModifyOwnedResource(params: {
  role: OrgMemberRole;
  userId: string;
  createdBy: string | null;
}) {
  return canEditCampaign(params);
}

export function formatOrgMemberRoleLabel(role: OrgMemberRole) {
  return role === "leader" ? "Leader" : "Team";
}
