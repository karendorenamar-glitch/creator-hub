import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export type AdminContext = {
  userId: string;
  email: string | null;
};

/**
 * Server-side admin guard: checks the signed-in user against public.admins.
 * `is_admin()` inside RLS protects the data; this protects the routes.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/wedding/login?next=/admin");

  const supabase = await createWeddingClient();

  // is_admin() is SECURITY DEFINER, so this check does not depend on any
  // select policy on public.admins being configured correctly.
  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("[requireAdmin] is_admin rpc failed:", error.code, error.message);
  }

  if (isAdmin !== true) notFound();

  return { userId: user.id, email: user.email ?? null };
}

/**
 * Service-role client for reading auth.users. Server-only.
 * Call this ONLY after requireAdmin(); the key never reaches the browser.
 */
export function createAdminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Emails for a set of user ids, in one place, server-only. */
export async function getEmails(ids: string[]): Promise<Map<string, string>> {
  const admin = createAdminServiceClient();
  const map = new Map<string, string>();
  if (!admin) return map;

  for (const id of Array.from(new Set(ids)).slice(0, 50)) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data?.user?.email) map.set(id, data.user.email);
  }
  return map;
}

export type AdminOverview = {
  users: number;
  usersApprox: boolean;
  users7d: number;
  users30d: number;
  weddings: number;
  pending: number;
  approved: number;
  rejected: number;
  revenueIdr: number;
};

/** Real KPI figures. Revenue counts approved payments only. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createWeddingClient();

  const [weddingsCount, pending, approved, rejected, approvedRows] =
    await Promise.all([
      supabase.from("weddings").select("*", { count: "exact", head: true }),
      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
      supabase.from("payments").select("amount_idr").eq("status", "approved"),
    ]);

  const revenueIdr = (approvedRows.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_idr),
    0,
  );

  const admin = createAdminServiceClient();
  let users = 0;
  let users7d = 0;
  let users30d = 0;
  let usersApprox = false;

  if (admin) {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const rows = data?.users ?? [];
    users = rows.length;
    usersApprox = rows.length === 1000;
    const now = Date.now();
    for (const row of rows) {
      const created = new Date(row.created_at).getTime();
      if (now - created <= 7 * 86_400_000) users7d += 1;
      if (now - created <= 30 * 86_400_000) users30d += 1;
    }
  }

  return {
    users,
    usersApprox,
    users7d,
    users30d,
    weddings: weddingsCount.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    revenueIdr,
  };
}
