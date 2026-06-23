"use server";

import { redirect } from "next/navigation";
import { getPlanContext } from "@/lib/plan-enforcement";
import { getDefaultAppPath } from "@/lib/plan";
import {
  bootstrapDefaultOrgMembership,
  createOrganizationForUser,
  createOrganizationFromUserMetadata,
  getActiveOrgId,
  getActiveOrganization,
  getAuthUser,
  setActiveOrgCookie,
} from "@/lib/org";

export async function resolveAuthSession() {
  const user = await getAuthUser();

  if (!user) {
    return { error: "Not signed in." };
  }

  let orgId = await getActiveOrgId();

  if (!orgId) {
    const pending = await createOrganizationFromUserMetadata(user.id);
    if ("error" in pending && pending.error) {
      return { error: pending.error };
    }
    if ("orgId" in pending && pending.orgId) {
      orgId = pending.orgId;
    }
  }

  if (!orgId) {
    orgId = await bootstrapDefaultOrgMembership(user.id);
  }

  if (!orgId) {
    return { needsOnboarding: true as const };
  }

  await setActiveOrgCookie(orgId);
  const planContext = await getPlanContext(orgId);

  return {
    needsOnboarding: false as const,
    orgId,
    redirectTo: getDefaultAppPath(
      planContext?.plan ?? "free_trial",
      planContext?.isTrialExpired ?? false,
    ),
  };
}

export async function createOrganization(name: string) {
  const user = await getAuthUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await createOrganizationForUser(user.id, name);

  if (result.error || !result.data) {
    return { error: result.error ?? "Failed to create organization." };
  }

  return { data: result.data };
}

export async function getOrganizationSettings() {
  const organization = await getActiveOrganization();

  if (!organization) {
    return { error: "No active organization." };
  }

  return { data: organization };
}

export async function requireOrganizationOrRedirect() {
  const orgId = await getActiveOrgId();

  if (!orgId) {
    redirect("/onboarding");
  }

  return orgId;
}
