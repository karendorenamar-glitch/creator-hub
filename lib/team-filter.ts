import type { OrgMemberRole, OrgPlan } from "@/types/database";
import { planAllowsTeamInvites } from "@/lib/org-team";

export function parseTeamFilterParam(
  value: string | undefined,
  validMemberIds: Set<string>,
): string {
  if (!value || value === "all") {
    return "all";
  }

  return validMemberIds.has(value) ? value : "all";
}

export function resolveTeamFilterForRole(
  role: OrgMemberRole,
  teamFilter: string,
): string {
  if (role !== "leader") {
    return "all";
  }

  return teamFilter;
}

/** Leaders use URL team filter; team members only see their own records. */
export function resolveResourceScopeFilter(
  role: OrgMemberRole,
  userId: string,
  leaderTeamFilter: string,
): string {
  if (role === "team") {
    return userId;
  }

  return leaderTeamFilter;
}

export function matchesTeamResourceFilter(
  createdBy: string | null | undefined,
  teamFilter: string,
): boolean {
  if (teamFilter === "all") {
    return true;
  }

  if (!createdBy) {
    return false;
  }

  return createdBy === teamFilter;
}

export function shouldShowTeamFilter(
  isLeader: boolean,
  plan: OrgPlan,
): boolean {
  return isLeader && planAllowsTeamInvites(plan);
}
