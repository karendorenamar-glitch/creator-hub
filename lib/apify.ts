const APIFY_BASE_URL = "https://api.apify.com/v2";
const TIKTOK_VIDEO_ACTOR = "clockworks~tiktok-video-scraper";

export type TikTokMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN?.trim();

  if (!token) {
    throw new Error("APIFY_TOKEN is not configured.");
  }

  return token;
}

function numberOrZero(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function parseApifyError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };

    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Fall through to generic message.
  }

  if (status === 401) {
    return "Invalid Apify API token. Check APIFY_TOKEN in .env.local.";
  }

  return `Apify request failed (${status}).`;
}

export async function fetchTikTokMetrics(videoUrl: string): Promise<TikTokMetrics> {
  const token = getApifyToken();
  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${TIKTOK_VIDEO_ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        postURLs: [videoUrl.trim()],
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseApifyError(response.status, body));
  }

  const items = (await response.json()) as Array<Record<string, unknown>>;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No metrics found for this TikTok URL.");
  }

  const item = items[0];

  return {
    views: numberOrZero(item.playCount),
    likes: numberOrZero(item.diggCount),
    comments: numberOrZero(item.commentCount),
    shares: numberOrZero(item.shareCount),
    saves: numberOrZero(item.collectCount),
  };
}
