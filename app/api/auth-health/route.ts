export const dynamic = "force-dynamic";

/**
 * Server-side auth health check. Uses the SAME environment variables as the
 * running deployment, so it reveals whether signup/login can actually work.
 *
 * Probes are read-only: a password grant with dummy credentials and a signup
 * with a deliberately weak password. Neither creates a user.
 */
export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const report: Record<string, unknown> = {
    project: url.replace("https://", "").replace(".supabase.co", ""),
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(key),
    anonKeyPrefix: key.slice(0, 14),
    anonKeyLength: key.length,
  };

  if (!url || !key) {
    return Response.json(
      { ...report, verdict: "Env Supabase belum lengkap di deployment ini." },
      { headers: { "cache-control": "no-store" } },
    );
  }

  async function post(
    path: string,
    body: unknown,
  ): Promise<{ status: number; body: string }> {
    try {
      const response = await fetch(`${url}${path}`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      return { status: response.status, body: (await response.text()).slice(0, 300) };
    } catch (error) {
      return { status: 0, body: String(error).slice(0, 200) };
    }
  }

  const settingsResponse = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    cache: "no-store",
  }).catch(() => null);

  const settings = settingsResponse
    ? await settingsResponse.json().catch(() => null)
    : null;

  const tokenProbe = await post("/auth/v1/token?grant_type=password", {
    email: "probe@invalid.test",
    password: "probe-password",
  });

  const signupProbe = await post("/auth/v1/signup", {
    email: "probe@invalid.test",
    password: "x",
  });

  const keyValid = tokenProbe.status === 400;
  const signupReachable = [400, 422, 429].includes(signupProbe.status);

  return Response.json(
    {
      ...report,
      settings: settings
        ? {
            disable_signup: settings.disable_signup,
            mailer_autoconfirm: settings.mailer_autoconfirm,
            email_provider: settings.external?.email,
          }
        : null,
      tokenProbe: { status: tokenProbe.status, body: tokenProbe.body },
      signupProbe: { status: signupProbe.status, body: signupProbe.body },
      verdict: !keyValid
        ? "ANON KEY TIDAK COCOK dengan project ini (token probe bukan 400)."
        : !signupReachable
          ? "Signup gagal di sisi Supabase — lihat signupProbe."
          : "Kunci valid dan endpoint signup merespons normal.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}