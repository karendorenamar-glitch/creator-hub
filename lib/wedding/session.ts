import { createWeddingClient } from "@/lib/wedding/supabase";
import type {
  Subscription,
  Wedding,
  WeddingMember,
  WeddingRole,
} from "@/lib/wedding/db-types";

export type WeddingSession = {
  userId: string;
  email: string | null;
  wedding: Wedding;
  subscription: Subscription | null;
  role: WeddingRole;
  members: WeddingMember[];
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

/** Signed-in user, or null. Never throws for a missing session. */
export async function getCurrentUser() {
  try {
    const supabase = await createWeddingClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

/**
 * The signed-in user's wedding, loaded through RLS with the anon key.
 * Returns null when the user has no membership yet (needs onboarding).
 */
export async function loadWeddingSession(): Promise<WeddingSession | null> {
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

    const { data: wedding } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", membership.wedding_id)
      .maybeSingle();

    if (!wedding) return null;

    const [
      { data: subscription },
      { data: members },
      { data: settings },
      { data: entitlement },
    ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("wedding_id", wedding.id)
          .maybeSingle(),
        supabase
          .from("wedding_members")
          .select("*")
          .eq("wedding_id", wedding.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("app_settings")
          .select("require_subscription")
          .eq("id", true)
          .maybeSingle(),
        supabase
          .from("user_entitlements")
          .select("user_id, lifetime_access_granted_at")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    // Safe default: if the settings row is missing (migration 004 not run yet),
    // behave as before and require an active subscription.
    const subscriptionRequired = settings?.require_subscription ?? true;

    return {
      userId: user.id,
      email: user.email ?? null,
      wedding,
      subscription: subscription ?? null,
      role: membership.role,
      members: members ?? [],
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
}

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

    const [{ data: membership }, { data: entitlement }, { data: settings }] =
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
        supabase
          .from("app_settings")
          .select("require_subscription")
          .eq("id", true)
          .maybeSingle(),
      ]);

    const subscriptionRequired = settings?.require_subscription ?? true;
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
