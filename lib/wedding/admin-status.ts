import { createWeddingClient } from "@/lib/wedding/supabase";

// Admin status only controls the optional sidebar link. A short in-process TTL
// avoids one Supabase round trip on every app page; requireAdmin() still checks
// access independently on /admin routes.
let cache: { userId: string; value: boolean; expiresAt: number } | null = null;

export async function getAdminStatus(userId: string): Promise<boolean> {
  if (cache && cache.userId === userId && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  const supabase = await createWeddingClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const value = Boolean(data);
  cache = { userId, value, expiresAt: Date.now() + 60_000 };
  return value;
}
