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

    const [{ data: subscription }, { data: members }] = await Promise.all([
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
    ]);

    return {
      userId: user.id,
      email: user.email ?? null,
      wedding,
      subscription: subscription ?? null,
      role: membership.role,
      members: members ?? [],
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
