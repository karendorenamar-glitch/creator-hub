// Build marker: lets you confirm exactly which code Vercel is serving.
// Open https://www.kefoo.tech/api/version — if the tag is older than the
// latest commit, the deployment has not picked up recent pushes.
export const BUILD_TAG = "8f2a32d-admin-rpc";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      tag: BUILD_TAG,
      env: {
        supabaseProject: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
          "https://",
          "",
        ).replace(".supabase.co", ""),
        hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasResend: Boolean(process.env.RESEND_API_KEY),
      },
      now: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}