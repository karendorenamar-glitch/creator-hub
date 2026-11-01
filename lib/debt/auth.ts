import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/wedding/session";
import { createDebtClient } from "@/lib/debt/supabase";

export type DebtOwner = {
  userId: string;
  email: string | null;
};

/**
 * Verifies both authentication and the server-managed debt allowlist.
 * `is_debt_owner()` is SECURITY DEFINER and cannot be used to enumerate users.
 * Cached per server request so layouts and pages share one check.
 */
export const getDebtOwner = cache(async (): Promise<DebtOwner | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const supabase = await createDebtClient();
    const { data, error } = await supabase.rpc("is_debt_owner");

    if (error || data !== true) return null;
    return { userId: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
});

export async function requireDebtOwner(): Promise<DebtOwner> {
  const owner = await getDebtOwner();
  if (!owner) redirect("/debt/login");
  return owner;
}
