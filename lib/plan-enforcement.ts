import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FREE_TRIAL_PLAN,
  DEFAULT_ORG_ID,
  applyLifetimeScalePlanOverride,
  getFallbackOrgPlan,
  isLifetimeScaleEmail,
  isMissingPlanColumnError,
} from "@/lib/org-plan-schema";
import {
  formatPlanLimitMessage,
  getAccessLockMessage,
  getPlanLimit,
  isAccessLocked,
  isFreeTrialPlan,
  isPaidPlan,
  isSubscriptionExpired,
  isTrialExpired,
  normalizeOrgPlan,
  PLAN_LIMITS,
  resolveSubscriptionEndsAt,
  resolveSubscriptionEndsAtFromStoredDate,
  resolveTrialEndsAt,
  type OrgPlan,
  type OrgUsage,
  type PlanContext,
  type PlanResource,
} from "@/lib/plan";
import {
  FEATURE_UPGRADE_MESSAGES,
  hasPlanFeature,
} from "@/lib/plan-features";
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

type OrgPlanRecord = Pick<
  Organization,
  "id" | "plan" | "trial_started_at" | "trial_ends_at" | "created_at"
>;

function buildDefaultPlanRecord(
  orgId: string,
  createdAt?: string | null,
): OrgPlanRecord {
  const fallback = getFallbackOrgPlan(orgId, createdAt);

  return {
    id: orgId,
    plan: fallback.plan,
    trial_started_at: null,
    trial_ends_at: fallback.trial_ends_at,
    created_at: createdAt ?? new Date().toISOString(),
  };
}

async function persistTrialEndsAtIfMissing(
  orgId: string,
  record: OrgPlanRecord,
  resolvedTrialEndsAt: string | null,
) {
  if (
    !isFreeTrialPlan(record.plan as OrgPlan) ||
    record.trial_ends_at ||
    !record.created_at ||
    !resolvedTrialEndsAt
  ) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ trial_ends_at: resolvedTrialEndsAt })
    .eq("id", orgId)
    .eq("plan", "free_trial");

  if (error && !isMissingPlanColumnError(error.message)) {
    console.error("Failed to backfill trial end date:", error.message);
  }
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

async function resolvePlanRecordWithOverrides(record: OrgPlanRecord) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return applyLifetimeScalePlanOverride(record, user?.email);
}

async function resolveEffectiveOrgPlan(
  orgId: string,
  record: OrgPlanRecord,
): Promise<OrgPlan> {
  const storedPlan = normalizeOrgPlan(record.plan);

  if (storedPlan === "growth" || storedPlan === "scale") {
    return storedPlan;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("plan")
    .eq("org_id", orgId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data?.plan) {
    return normalizeOrgPlan(data.plan);
  }

  return storedPlan;
}

async function finalizePlanRecord(
  orgId: string,
  record: OrgPlanRecord,
): Promise<OrgPlanRecord> {
  const plan = await resolveEffectiveOrgPlan(orgId, record);

  return {
    ...record,
    plan,
    trial_ends_at: isFreeTrialPlan(plan) ? record.trial_ends_at : null,
  };
}

export async function getOrganizationPlanRecord(
  orgId: string,
): Promise<OrgPlanRecord | null> {
  const supabase = await createClient();

  const { data: withPlan, error: withPlanError } = await supabase
    .from("organizations")
    .select("id, plan, trial_started_at, trial_ends_at, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!withPlanError && withPlan) {
    return finalizePlanRecord(
      orgId,
      await resolvePlanRecordWithOverrides({
        id: withPlan.id,
        plan: normalizeOrgPlan(withPlan.plan),
        trial_started_at: withPlan.trial_started_at,
        trial_ends_at: withPlan.trial_ends_at,
        created_at: withPlan.created_at,
      }),
    );
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
      return finalizePlanRecord(
        orgId,
        await resolvePlanRecordWithOverrides(
          buildDefaultPlanRecord(basic.id, basic.created_at),
        ),
      );
    }
  }

  const membershipOrgId = await getVerifiedOrgMembership(orgId);
  if (membershipOrgId) {
    return finalizePlanRecord(
      orgId,
      await resolvePlanRecordWithOverrides(
        buildDefaultPlanRecord(membershipOrgId),
      ),
    );
  }

  if (withPlanError) {
    console.error("Failed to fetch organization plan:", withPlanError.message);
  }

  return null;
}

type ApprovedPayment = {
  plan: string;
  payment_date: string;
  subscription_ends_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

async function getLatestApprovedPayment(
  orgId: string,
): Promise<ApprovedPayment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("plan, payment_date, subscription_ends_at, reviewed_at, created_at")
    .eq("org_id", orgId)
    .eq("status", "approved")
    .order("payment_date", { ascending: false })
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch approved payment:", error.message);
    return null;
  }

  return data;
}

async function resolveSubscriptionState(
  orgId: string,
  plan: OrgPlan,
  userEmail: string | null | undefined,
) {
  if (
    !isPaidPlan(plan) ||
    isLifetimeScaleEmail(userEmail) ||
    orgId === DEFAULT_ORG_ID
  ) {
    return {
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
      isSubscriptionExpired: false,
    };
  }

  const payment = await getLatestApprovedPayment(orgId);

  if (!payment?.payment_date) {
    return {
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
      isSubscriptionExpired: false,
    };
  }

  const subscriptionEndsAt = resolveSubscriptionEndsAtFromStoredDate(
    payment.payment_date,
    payment.subscription_ends_at,
  );

  return {
    subscriptionStartedAt: payment.payment_date,
    subscriptionEndsAt,
    isSubscriptionExpired: isSubscriptionExpired(
      plan,
      subscriptionEndsAt,
      payment.subscription_ends_at,
    ),
  };
}

export async function getPlanContext(orgId: string): Promise<PlanContext | null> {
  const org = await getOrganizationPlanRecord(orgId);

  if (!org) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plan = normalizeOrgPlan(org.plan);
  const trialStartedAt = org.trial_started_at ?? org.created_at ?? null;
  const trialEndsAt = resolveTrialEndsAt(
    plan,
    org.trial_ends_at,
    trialStartedAt,
  );

  await persistTrialEndsAtIfMissing(orgId, org, trialEndsAt);

  const subscription = await resolveSubscriptionState(
    orgId,
    plan,
    user?.email,
  );
  const isTrialExpiredValue = isTrialExpired(
    plan,
    org.trial_ends_at,
    trialStartedAt,
  );
  const isAccessLockedValue = isAccessLocked(
    isTrialExpiredValue,
    subscription.isSubscriptionExpired,
  );
  const usage = await getOrgUsage(orgId);

  return {
    plan,
    trialStartedAt,
    trialEndsAt,
    isFreeTrial: plan === "free_trial",
    isTrialExpired: isTrialExpiredValue,
    subscriptionStartedAt: subscription.subscriptionStartedAt,
    subscriptionEndsAt: subscription.subscriptionEndsAt,
    isSubscriptionExpired: subscription.isSubscriptionExpired,
    isAccessLocked: isAccessLockedValue,
    limits: PLAN_LIMITS[plan],
    usage,
  };
}

async function assertWorkspaceAccess(orgId: string) {
  const context = await getPlanContext(orgId);

  if (!context) {
    return { error: "Organization not found." };
  }

  if (context.isAccessLocked) {
    return {
      error: getAccessLockMessage(
        context.plan,
        context.isTrialExpired,
        context.isSubscriptionExpired,
      ),
    };
  }

  return { ok: true as const, context };
}

function getUsageCount(usage: OrgUsage, resource: PlanResource) {
  return usage[resource];
}

export async function assertCanCreateResource(
  orgId: string,
  resource: PlanResource,
  options?: { additionalCount?: number },
) {
  const access = await assertWorkspaceAccess(orgId);

  if ("error" in access) {
    return { error: access.error };
  }

  const plan = access.context.plan;

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

export async function assertCanUseTikTokImport(orgId: string) {
  const access = await assertWorkspaceAccess(orgId);

  if ("error" in access) {
    return { error: access.error };
  }

  return { ok: true as const };
}

export async function assertCanUseBulkUpload(orgId: string) {
  const access = await assertWorkspaceAccess(orgId);

  if ("error" in access) {
    return { error: access.error };
  }

  const plan = access.context.plan;

  if (!hasPlanFeature(plan, "bulk_upload")) {
    return { error: FEATURE_UPGRADE_MESSAGES.bulk_upload };
  }

  return { ok: true as const };
}
