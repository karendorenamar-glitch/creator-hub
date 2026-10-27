import { revalidatePath } from "next/cache";
import { getLocale } from "@/lib/i18n/get-locale";
import { moduleCopy, type ModuleCopy } from "@/lib/wedding/module-copy";
import {
  getCurrentUser,
  type WeddingSession,
} from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import type { WeddingDatabase } from "@/lib/wedding/db-types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { error?: string; success?: string } | null;

export type ActionSession = Pick<
  WeddingSession,
  "userId" | "email" | "wedding"
>;

export type ActionContext = {
  session: ActionSession;
  copy: ModuleCopy;
  locale: "en" | "id";
  supabase: SupabaseClient<WeddingDatabase>;
};

/** Session + localized copy + RLS-scoped client, or null when signed out. */
export async function getActionContext(): Promise<ActionContext | null> {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) return null;

  const supabase = await createWeddingClient();
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", membership.wedding_id)
    .maybeSingle();

  if (!wedding) return null;

  // Actions only need the workspace and copy. Subscription/access is enforced
  // by RLS on the mutation itself, so avoid loading five extra session tables.
  return {
    session: { userId: user.id, email: user.email, wedding },
    locale,
    copy: moduleCopy[locale],
    supabase,
  };
}

type SupabaseError = { code?: string; message: string };

/**
 * Maps Postgres/PostgREST errors to a user-facing message.
 * 42501 is what RLS raises when the subscription is inactive or the row
 * belongs to another wedding - never bypass it, just explain it.
 */
export function actionError(
  error: SupabaseError,
  copy: ModuleCopy,
): string {
  const message = error.message.toLowerCase();

  if (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return copy.errors.subscriptionRequired;
  }
  if (error.code === "23505" || message.includes("duplicate key")) {
    return copy.errors.duplicate;
  }
  if (error.code === "23503") {
    return copy.errors.notFound;
  }
  if (error.code === "PGRST116") {
    return copy.errors.notFound;
  }
  if (error.code === "23514" || error.code === "22P02") {
    return copy.errors.invalid;
  }

  return copy.errors.generic;
}

export function revalidateWedding(...paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
  // Dashboard totals and the sidebar summary depend on the same rows. Keep
  // this invalidation; the page/query parallelism above is the real latency win.
  revalidatePath("/wedding/dashboard");
}
