import { cache } from "react";
import { createWeddingClient } from "@/lib/wedding/supabase";
import type {
  Subscription,
  Wedding,
  WeddingRole,
} from "@/lib/wedding/db-types";

export type CurrentUser = {
  id: string;
  email: string | null;
};

export type WeddingSession = {
  userId: string;
  email: string | null;
  wedding: Wedding;
  subscription: Subscription | null;
  role: WeddingRole;
  /** True when the ACCOUNT owns lifetime access (paid before onboarding). */
  hasEntitlement: boolean;
  /** False while the temporary open-access switch is on. */
  subscriptionRequired: boolean;
  /** True when the member may use planning features right now. */
  hasPlanningAccess: boolean;
};

export function isSubscriptionActive(
  subscription: Subscription | null | undefined,
): boolean {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.current_period_end) return false;

  return new Date(subscription.current_period_end).getTime() > Date.now();
}

/**
 * Verified signed-in user, or null. `getClaims()` verifies the access token
 * locally with the project's asymmetric JWT key instead of calling the Auth
 * server on every request. Cached per server request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createWeddingClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || typeof claims?.sub !== "string") return null;

    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
    };
  } catch {
    return null;
  }
});

// app_settings is global and changes rarely. A short in-process TTL removes one
// Supabase round trip from warm page/action requests without caching user data.
let subscriptionSettingCache: { value: boolean; expiresAt: number } | null = null;

async function loadSubscriptionRequired(
  supabase: Awaited<ReturnType<typeof createWeddingClient>>,
): Promise<boolean> {
  if (subscriptionSettingCache && subscriptionSettingCache.expiresAt > Date.now()) {
    return subscriptionSettingCache.value;
  }

  const { data } = await supabase
    .from("app_settings")
    .select("require_subscription")
    .eq("id", true)
    .maybeSingle();

  const value = data?.require_subscription ?? true;
  subscriptionSettingCache = { value, expiresAt: Date.now() + 60_000 };
  return value;
}

/**
 * The signed-in user's wedding, loaded through RLS with the anon key. Cached
 * per server request so the app layout and page do not repeat the same queries.
 * Returns null when the user has no membership yet (needs onboarding).
 */
export const loadWeddingSession = cache(async (): Promise<WeddingSession | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const supabase = await createWeddingClient();

    const { data: membership } = await supabase
      .from("wedding_members")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return null;

    const [
      { data: wedding },
      { data: subscription },
      subscriptionRequired,
      { data: entitlement },
    ] = await Promise.all([
      supabase
        .from("weddings")
        .select("*")
        .eq("id", membership.wedding_id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("wedding_id", membership.wedding_id)
        .maybeSingle(),
      loadSubscriptionRequired(supabase),
      supabase
        .from("user_entitlements")
        .select("user_id, lifetime_access_granted_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!wedding) return null;

    return {
      userId: user.id,
      email: user.email ?? null,
      wedding,
      subscription: subscription ?? null,
      role: membership.role,
      subscriptionRequired,
      hasEntitlement: Boolean(entitlement?.lifetime_access_granted_at),
      hasPlanningAccess:
        !subscriptionRequired ||
        isSubscriptionActive(subscription ?? null) ||
        Boolean(entitlement?.lifetime_access_granted_at) ||
        Boolean(wedding.lifetime_access_granted_at),
    };
  } catch {
    return null;
  }
});

export function coupleNames(wedding: Wedding): string {
  const second = wedding.partner_two_name?.trim();
  return second
    ? `${wedding.partner_one_name} & ${second}`
    : wedding.partner_one_name;
}

/**
 * Account-level context for pages that must work BEFORE a wedding exists
 * (checkout, onboarding gating). Unlike loadWeddingSession this never returns
 * null for a signed-in user who has not completed onboarding yet.
 */
export type AccountContext = {
  userId: string;
  email: string | null;
  hasWedding: boolean;
  hasEntitlement: boolean;
  hasActiveSubscription: boolean;
};

export async function loadAccountContext(): Promise<AccountContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const supabase = await createWeddingClient();

    const [{ data: membership }, { data: entitlement }, subscriptionRequired] =
      await Promise.all([
        supabase
          .from("wedding_members")
          .select("wedding_id")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_entitlements")
          .select("lifetime_access_granted_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        loadSubscriptionRequired(supabase),
      ]);

    const entitled = Boolean(entitlement?.lifetime_access_granted_at);

    return {
      userId: user.id,
      email: user.email ?? null,
      hasWedding: Boolean(membership),
      hasEntitlement: entitled,
      hasActiveSubscription: !subscriptionRequired || entitled,
    };
  } catch {
    return null;
  }
}
