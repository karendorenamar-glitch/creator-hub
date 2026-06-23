import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FREE_TRIAL_PLAN,
  DEFAULT_ORG_ID,
  getFallbackOrgPlan,
  isMissingPlanColumnError,
} from "@/lib/org-plan-schema";
import {
  formatPlanLimitMessage,
  getPlanLimit,
  isTrialExpired,
  PLAN_LIMITS,
  type OrgPlan,
  type OrgUsage,
  type PlanContext,
  type PlanResource,
} from "@/lib/plan";
import type { Organization } from "@/types/database";

export async function getOrgUsage(orgId: string): Promise<OrgUsage> {
  const supabase = await createClient();

  const [campaignsResult, creatorsResult, videosResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("creators")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  return {
    campaigns: campaignsResult.count ?? 0,
    creators: creatorsResult.count ?? 0,
    videos: videosResult.count ?? 0,
  };
}

function buildDefaultPlanRecord(
  orgId: string,
  createdAt?: string | null,
): Pick<Organization, "id" | "plan" | "trial_ends_at"> {
  const fallback = getFallbackOrgPlan(orgId, createdAt);

  return {
    id: orgId,
    plan: fallback.plan,
    trial_ends_at: fallback.trial_ends_at,
  };
}

async function getVerifiedOrgMembership(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.org_id ?? null;
}

export async function getOrganizationPlanRecord(
  orgId: string,
): Promise<Pick<Organization, "id" | "plan" | "trial_ends_at"> | null> {
  const supabase = await createClient();

  const { data: withPlan, error: withPlanError } = await supabase
    .from("organizations")
    .select("id, plan, trial_ends_at, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!withPlanError && withPlan) {
    return {
      id: withPlan.id,
      plan: (withPlan.plan ?? DEFAULT_FREE_TRIAL_PLAN) as Organization["plan"],
      trial_ends_at: withPlan.trial_ends_at,
    };
  }

  const withPlanErrorMessage = withPlanError?.message ?? null;

  const shouldTryBasicSelect =
    !withPlan ||
    (withPlanErrorMessage !== null &&
      isMissingPlanColumnError(withPlanErrorMessage));

  if (shouldTryBasicSelect) {
    const { data: basic, error: basicError } = await supabase
      .from("organizations")
      .select("id, created_at")
      .eq("id", orgId)
      .maybeSingle();

    if (!basicError && basic) {
      return buildDefaultPlanRecord(basic.id, basic.created_at);
    }
  }

  const membershipOrgId = await getVerifiedOrgMembership(orgId);
  if (membershipOrgId) {
    return buildDefaultPlanRecord(membershipOrgId);
  }

  if (withPlanError) {
    console.error("Failed to fetch organization plan:", withPlanError.message);
  }

  return null;
}

export async function getPlanContext(orgId: string): Promise<PlanContext | null> {
  const org = await getOrganizationPlanRecord(orgId);

  if (!org) {
    return null;
  }

  const plan = (org.plan ?? "free_trial") as OrgPlan;
  const usage = await getOrgUsage(orgId);

  return {
    plan,
    trialEndsAt: org.trial_ends_at,
    isFreeTrial: plan === "free_trial",
    isTrialExpired: isTrialExpired(plan, org.trial_ends_at),
    limits: PLAN_LIMITS[plan],
    usage,
  };
}

function getUsageCount(usage: OrgUsage, resource: PlanResource) {
  return usage[resource];
}

export async function assertCanCreateResource(
  orgId: string,
  resource: PlanResource,
  options?: { additionalCount?: number },
) {
  const org = await getOrganizationPlanRecord(orgId);

  if (!org) {
    return { error: "Organization not found." };
  }

  const plan = (org.plan ?? "free_trial") as OrgPlan;

  if (isTrialExpired(plan, org.trial_ends_at)) {
    return {
      error: "Your free trial has ended. Upgrade your plan to continue.",
    };
  }

  const limit = getPlanLimit(plan, resource);

  if (limit === null) {
    return { ok: true as const };
  }

  const usage = await getOrgUsage(orgId);
  const nextCount =
    getUsageCount(usage, resource) + Math.max(1, options?.additionalCount ?? 1);

  if (nextCount > limit) {
    return { error: formatPlanLimitMessage(resource, limit, plan) };
  }

  return { ok: true as const };
}
