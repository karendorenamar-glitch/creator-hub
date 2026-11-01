import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { DebtDatabase } from "@/lib/debt/db-types";

/**
 * Server-only Supabase client for the private debt ledger.
 * Uses the same project, publishable key, and SSR cookie convention as the
 * existing app. It never uses the service-role key.
 */
export async function createDebtClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<DebtDatabase>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes from a Server Component are handled by middleware.
        }
      },
    },
  });
}
