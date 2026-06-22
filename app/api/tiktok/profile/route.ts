import { NextResponse } from "next/server";
import { fetchTikTokProfile } from "@/lib/apify";
import { normalizeCreatorPlatformUsername } from "@/lib/utils";

export async function POST(request: Request) {
  try {
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
