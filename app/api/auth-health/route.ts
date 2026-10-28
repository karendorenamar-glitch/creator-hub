import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const dynamic = "force-dynamic";

/**
 * Admin-only auth diagnostics. Keep this behind the same admin check as /admin
 * so it cannot be used to fingerprint the project or generate auth traffic.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });

  const supabase = await createWeddingClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return new Response("Not found", { status: 404 });

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) {
    return Response.json(
      { hasUrl: false, hasAnonKey: false, verdict: "Env Supabase belum lengkap." },
      { headers: { "cache-control": "no-store" } },
    );
  }

  async function post(path: string, body: unknown) {
    try {
      const response = await fetch(`${url}${path}`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      return response.status;
    } catch {
      return 0;
    }
  }

  const settingsResponse = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    cache: "no-store",
  }).catch(() => null);
  const settings = settingsResponse
    ? await settingsResponse.json().catch(() => null)
    : null;

  const tokenStatus = await post("/auth/v1/token?grant_type=password", {
    email: "probe@invalid.test",
    password: "probe-password",
  });
  const signupStatus = await post("/auth/v1/signup", {
    email: "probe@invalid.test",
    password: "x",
  });

  const keyValid = tokenStatus === 400;
  const signupReachable = [400, 422, 429].includes(signupStatus);

  return Response.json(
    {
      hasUrl: true,
      hasAnonKey: true,
      settings: settings
        ? {
            disable_signup: settings.disable_signup,
            mailer_autoconfirm: settings.mailer_autoconfirm,
          }
        : null,
      tokenStatus,
      signupStatus,
      verdict: !keyValid
        ? "Anon key tidak cocok dengan project ini."
        : !signupReachable
          ? "Signup gagal di sisi Supabase."
          : "Kunci valid dan endpoint signup merespons normal.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
