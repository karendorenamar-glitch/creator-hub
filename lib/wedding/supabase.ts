import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { WeddingDatabase } from "@/lib/wedding/db-types";

/**
 * Server-only Supabase client typed against the wedding schema.
 * Uses the publishable/anon key and the signed-in user's cookies, so every
 * query is still filtered by Row Level Security.
 *
 * Never use the service-role key here.
 */
export async function createWeddingClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<WeddingDatabase>(url, anonKey, {
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
          // Called from a Server Component - cookie writes must happen in
          // middleware, a route handler, or a Server Action.
        }
      },
    },
  });
}

/**
 * Session-less client for authentication calls that must NOT carry the
 * visitor's current session (sign up, password reset). A stale cookie from a
 * previous Supabase project otherwise produces a 401 bad_jwt error.
 */
export function createWeddingAnonymousClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient<WeddingDatabase>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
