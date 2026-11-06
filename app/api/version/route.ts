import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Current build id, used by clients to detect a stale bundle. */
export async function GET() {
  return NextResponse.json(
    {
      build:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.VERCEL_DEPLOYMENT_ID ??
        "dev",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
