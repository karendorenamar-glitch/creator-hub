export function isMissingPlanColumnError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();
  const mentionsPlanColumn =
    lower.includes("plan") || lower.includes("trial_ends_at");
  const schemaIssue =
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("could not find");

  return mentionsPlanColumn && schemaIssue;
}

export function defaultTrialEndsAt(fromDate?: string | null) {
  const date = fromDate ? new Date(fromDate) : new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export function isDuplicateOrgSlugError(message: string | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("organizations_slug_unique") ||
    message.includes('duplicate key value violates unique constraint "organizations_slug_unique"')
  );
}

export const DEFAULT_FREE_TRIAL_PLAN = "free_trial" as const;

/** Default workspace for legacy data; full access in production. */
export const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";

export const DEFAULT_FULL_ACCESS_PLAN = "scale" as const;

/** Owner account with permanent Scale access in app and on new workspaces. */
export const LIFETIME_SCALE_EMAIL = "karendorenamar@gmail.com";

export function normalizeAccountEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isLifetimeScaleEmail(email: string | null | undefined) {
  return normalizeAccountEmail(email) === normalizeAccountEmail(LIFETIME_SCALE_EMAIL);
}

export function getOrgPlanForNewOrganization(userEmail: string | null | undefined): {
  plan: typeof DEFAULT_FREE_TRIAL_PLAN | typeof DEFAULT_FULL_ACCESS_PLAN;
  trial_ends_at: string | null;
} {
  if (isLifetimeScaleEmail(userEmail)) {
    return {
      plan: DEFAULT_FULL_ACCESS_PLAN,
      trial_ends_at: null,
    };
  }

  return {
    plan: DEFAULT_FREE_TRIAL_PLAN,
    trial_ends_at: defaultTrialEndsAt(),
  };
}

export function applyLifetimeScalePlanOverride<
  T extends { plan: string; trial_ends_at: string | null },
>(record: T, userEmail: string | null | undefined): T {
  if (!isLifetimeScaleEmail(userEmail)) {
    return record;
  }

  return {
    ...record,
    plan: DEFAULT_FULL_ACCESS_PLAN,
    trial_ends_at: null,
  };
}

export function getFallbackOrgPlan(
  orgId: string,
  createdAt?: string | null,
): {
  plan: typeof DEFAULT_FREE_TRIAL_PLAN | typeof DEFAULT_FULL_ACCESS_PLAN;
  trial_ends_at: string | null;
} {
  if (orgId === DEFAULT_ORG_ID) {
    return {
      plan: DEFAULT_FULL_ACCESS_PLAN,
      trial_ends_at: null,
    };
  }

  return {
    plan: DEFAULT_FREE_TRIAL_PLAN,
    trial_ends_at: defaultTrialEndsAt(createdAt),
  };
}
