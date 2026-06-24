import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function purgeOrphanedAuthUser(userId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { count, error: membershipError } = await admin
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (membershipError || (count ?? 0) > 0) {
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error && !error.message.toLowerCase().includes("not found")) {
    console.error("[purgeOrphanedAuthUser]", error.message);
  }
}
