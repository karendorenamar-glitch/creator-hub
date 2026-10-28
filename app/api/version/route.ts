// Build marker: lets you confirm exactly which code Vercel is serving.
// Open https://www.kefoo.tech/api/version — if the commit is older than the
// latest push, the deployment has not picked it up.
export const BUILD_TAG = "12616a3-inspiration";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      tag: BUILD_TAG,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      now: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
