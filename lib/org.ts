import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  defaultTrialEndsAt,
  DEFAULT_FREE_TRIAL_PLAN,
  DEFAULT_FULL_ACCESS_PLAN,
  DEFAULT_ORG_ID,
  getFallbackOrgPlan,
  getOrgPlanForNewOrganization,
  isDuplicateOrgSlugError,
  isLifetimeScaleEmail,
  isMissingPlanColumnError,
} from "@/lib/org-plan-schema";
import type { Organization } from "@/types/database";
import type { OrgPlan } from "@/lib/plan";

export { DEFAULT_ORG_ID } from "@/lib/org-plan-schema";

export const ACTIVE_ORG_COOKIE = "kefoo_org_id";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function setActiveOrgCookie(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearActiveOrgCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, name, slug, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch organizations:", error.message);
    return [];
  }

  return (memberships ?? [])
    .map((row) => {
      const org = row.organizations;

      if (!org || Array.isArray(org)) {
        return null;
      }

      return org as Organization;
    })
    .filter((org): org is Organization => org !== null);
}

async function getOrgPlanForRouting(
  orgId: string,
  userEmail?: string | null,
): Promise<OrgPlan> {
  if (isLifetimeScaleEmail(userEmail)) {
    return DEFAULT_FULL_ACCESS_PLAN;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("plan, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!error && data?.plan) {
    return data.plan as OrgPlan;
  }

  if (!error && data) {
    return getFallbackOrgPlan(orgId, data.created_at).plan;
  }

  if (error && isMissingPlanColumnError(error.message)) {
    const { data: basic } = await supabase
      .from("organizations")
      .select("created_at")
      .eq("id", orgId)
      .maybeSingle();

    return getFallbackOrgPlan(orgId, basic?.created_at).plan;
  }

  return getFallbackOrgPlan(orgId).plan;
}

async function resolveActiveOrgId(userId: string): Promise<string | null> {
  const user = await getAuthUser();
  const userEmail = user?.email ?? null;
  const organizations = await getUserOrganizations(userId);
  if (organizations.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  let candidateId: string | null = null;

  if (cookieOrgId && organizations.some((org) => org.id === cookieOrgId)) {
    candidateId = cookieOrgId;
  } else if (organizations.some((org) => org.id === DEFAULT_ORG_ID)) {
    candidateId = DEFAULT_ORG_ID;
  } else {
    candidateId = organizations[0]?.id ?? null;
  }

  if (
    !candidateId ||
    candidateId === DEFAULT_ORG_ID ||
    !organizations.some((org) => org.id === DEFAULT_ORG_ID)
  ) {
    return candidateId;
  }

  const [candidatePlan, defaultPlan] = await Promise.all([
    getOrgPlanForRouting(candidateId, userEmail),
    getOrgPlanForRouting(DEFAULT_ORG_ID, userEmail),
  ]);

  if (candidatePlan === "free_trial" && defaultPlan === "scale") {
    return DEFAULT_ORG_ID;
  }

  return candidateId;
}

export async function getActiveOrgId(): Promise<string | null> {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  return resolveActiveOrgId(user.id);
}

export async function requireActiveOrgId(): Promise<string> {
  const orgId = await getActiveOrgId();

  if (!orgId) {
    throw new Error("No active organization.");
  }

  return orgId;
}

export async function getOrgIdForAction(): Promise<
  { orgId: string } | { error: string }
> {
  const user = await getAuthUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const orgId = await getActiveOrgId();

  if (!orgId) {
    return { error: "No active organization." };
  }

  return { orgId };
}

export async function getActiveOrganization(): Promise<Organization | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, trial_ends_at, created_at")
    .eq("id", orgId)
    .maybeSingle();

  if (!error && data) {
    return data as Organization;
  }

  if (error && isMissingPlanColumnError(error.message)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("id", orgId)
      .maybeSingle();

    if (fallbackError || !fallback) {
      console.error("Failed to fetch active organization:", fallbackError?.message);
      return null;
    }

    const planFallback = getFallbackOrgPlan(orgId, fallback.created_at);

    return {
      ...fallback,
      plan: planFallback.plan,
      trial_ends_at: planFallback.trial_ends_at,
    };
  }

  if (error) {
    console.error("Failed to fetch active organization:", error.message);
  }

  return null;
}

export async function bootstrapDefaultOrgMembership(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing?.org_id) {
    return existing.org_id;
  }

  const { data: defaultOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", DEFAULT_ORG_ID)
    .maybeSingle();

  if (!defaultOrg?.id) {
    return null;
  }

  const { error } = await supabase.from("org_members").insert({
    org_id: defaultOrg.id,
    user_id: userId,
    role: "owner",
  });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    console.error("Failed to bootstrap org membership:", error.message);
    return null;
  }

  return defaultOrg.id;
}

export async function createOrganizationFromUserMetadata(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { error: "Not signed in." };
  }

  const workspaceName =
    typeof user.user_metadata?.workspace_name === "string"
      ? user.user_metadata.workspace_name.trim()
      : "";

  if (!workspaceName) {
    return { created: false as const };
  }

  const orgResult = await createOrganizationForUser(userId, workspaceName);

  if (orgResult.error || !orgResult.data) {
    return { error: orgResult.error ?? "Failed to create workspace." };
  }

  await setActiveOrgCookie(orgResult.data.id);
  return { created: true as const, orgId: orgResult.data.id };
}

function slugifyOrgName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

function buildOrgSlugCandidates(name: string) {
  const base = slugifyOrgName(name);
  const candidates = [base];

  for (let index = 0; index < 5; index += 1) {
    candidates.push(`${base}-${crypto.randomUUID().slice(0, 6)}`);
  }

  return candidates;
}

async function createOrganizationAttempt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  trimmedName: string,
  slug: string,
  orgPlan: typeof DEFAULT_FREE_TRIAL_PLAN | typeof DEFAULT_FULL_ACCESS_PLAN,
  orgTrialEndsAt: string | null,
) {
  const rpcResult = await supabase.rpc("create_organization_for_user", {
    org_name: trimmedName,
    org_slug: slug,
    org_plan: orgPlan,
    org_trial_ends_at: orgTrialEndsAt ?? undefined,
  });

  if (!rpcResult.error && rpcResult.data) {
    const organization = Array.isArray(rpcResult.data)
      ? rpcResult.data[0]
      : rpcResult.data;

    if (organization?.id) {
      return { data: organization as Organization };
    }
  }

  const rpcMissing =
    rpcResult.error?.message.includes("create_organization_for_user") ||
    rpcResult.error?.message.includes("Could not find the function");

  if (
    rpcResult.error &&
    !rpcMissing &&
    !isMissingPlanColumnError(rpcResult.error.message) &&
    !isDuplicateOrgSlugError(rpcResult.error.message)
  ) {
    return { error: rpcResult.error.message };
  }

  if (rpcResult.error && isDuplicateOrgSlugError(rpcResult.error.message)) {
    return { error: rpcResult.error.message, duplicateSlug: true as const };
  }

  const organization = await createOrganizationWithMembershipFallback({
    supabase,
    userId,
    trimmedName,
    slug,
    orgPlan,
    orgTrialEndsAt,
    includePlanFields: !isMissingPlanColumnError(rpcResult.error?.message),
  });

  if ("error" in organization) {
    if (isDuplicateOrgSlugError(organization.error)) {
      return { error: organization.error, duplicateSlug: true as const };
    }

    return { error: organization.error };
  }

  return { data: organization.data };
}

export async function createOrganizationForUser(userId: string, name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();
  const user = await getAuthUser();
  const { plan: orgPlan, trial_ends_at: orgTrialEndsAt } =
    getOrgPlanForNewOrganization(user?.email);
  const slugCandidates = buildOrgSlugCandidates(trimmedName);

  for (const slug of slugCandidates) {
    const result = await createOrganizationAttempt(
      supabase,
      userId,
      trimmedName,
      slug,
      orgPlan,
      orgTrialEndsAt,
    );

    if ("data" in result && result.data) {
      await setActiveOrgCookie(result.data.id);
      return { data: result.data };
    }

    if (!("duplicateSlug" in result && result.duplicateSlug)) {
      return { error: result.error ?? "Failed to create organization." };
    }
  }

  return {
    error:
      "That workspace name is already taken. Try a slightly different name.",
  };
}

async function createOrganizationWithMembershipFallback({
  supabase,
  userId,
  trimmedName,
  slug,
  orgPlan,
  orgTrialEndsAt,
  includePlanFields,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  trimmedName: string;
  slug: string;
  orgPlan: typeof DEFAULT_FREE_TRIAL_PLAN | typeof DEFAULT_FULL_ACCESS_PLAN;
  orgTrialEndsAt: string | null;
  includePlanFields: boolean;
}) {
  const orgId = crypto.randomUUID();
  const basePayload = {
    id: orgId,
    name: trimmedName,
    slug,
  };
  const payload = includePlanFields
    ? {
        ...basePayload,
        plan: orgPlan,
        trial_ends_at: orgTrialEndsAt,
      }
    : basePayload;

  const { error: orgInsertError } = await supabase
    .from("organizations")
    .insert(payload);

  if (orgInsertError) {
    if (includePlanFields && isMissingPlanColumnError(orgInsertError.message)) {
      return createOrganizationWithMembershipFallback({
        supabase,
        userId,
        trimmedName,
        slug,
        orgPlan,
        orgTrialEndsAt,
        includePlanFields: false,
      });
    }

    return { error: orgInsertError.message };
  }

  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: orgId,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("organizations").delete().eq("id", orgId);
    return { error: memberError.message };
  }

  const selectResult = includePlanFields
    ? await supabase
        .from("organizations")
        .select("id, name, slug, plan, trial_ends_at, created_at")
        .eq("id", orgId)
        .single()
    : await supabase
        .from("organizations")
        .select("id, name, slug, created_at")
        .eq("id", orgId)
        .single();

  const { data, error: selectError } = selectResult;

  if (selectError || !data) {
    return { error: selectError?.message ?? "Failed to load created organization." };
  }

  const organization = includePlanFields
    ? (data as Organization)
    : ({
        ...data,
        plan: DEFAULT_FREE_TRIAL_PLAN,
        trial_ends_at: defaultTrialEndsAt(data.created_at),
      } as Organization);

  return { data: organization };
}
