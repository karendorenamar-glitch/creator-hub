import { createBrowserClient } from "@supabase/ssr";
import type { WeddingDatabase } from "@/lib/wedding/db-types";

/**
 * Browser Supabase client for client components (password recovery, etc.).
 * Uses the publishable/anon key only — never the service-role key.
 * Sessions are stored in cookies by @supabase/ssr so server components
 * see the same session.
 */
export function createWeddingBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient<WeddingDatabase>(url, anonKey);
}