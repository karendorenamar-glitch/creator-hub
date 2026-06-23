import { NextResponse } from "next/server";
import { assertCanUseTikTokImport } from "@/lib/plan-enforcement";
import { fetchTikTokProfile } from "@/lib/apify";
import { getOrgIdForAction } from "@/lib/org";
import { normalizeCreatorPlatformUsername } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const orgResult = await getOrgIdForAction();
    if ("error" in orgResult) {
      return NextResponse.json({ error: orgResult.error }, { status: 401 });
    }

    const planCheck = await assertCanUseTikTokImport(orgResult.orgId);
    if ("error" in planCheck) {
      return NextResponse.json({ error: planCheck.error }, { status: 403 });
    }

    const body = (await request.json()) as { username?: string };
    const username = normalizeCreatorPlatformUsername(body.username);

    if (!username) {
      return NextResponse.json(
        { error: "TikTok username is required." },
        { status: 400 },
      );
    }

    const data = await fetchTikTokProfile(username);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch TikTok profile.",
      },
      { status: 400 },
    );
  }
}
