import { detectVideoPlatform, type VideoPlatform } from "@/lib/video-url";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const TIKTOK_VIDEO_ACTOR = "clockworks~tiktok-video-scraper";
const TIKTOK_PROFILE_ACTOR = "clockworks~tiktok-profile-scraper";
const INSTAGRAM_REEL_ACTOR = "apify~instagram-reel-scraper";

export type TikTokMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export type TikTokVideoData = TikTokMetrics & {
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorFollowers: number;
};

export type PlatformVideoData = TikTokVideoData & {
  platform: VideoPlatform;
};

export type TikTokProfileData = {
  followers: number;
  name: string | null;
};

export type TikTokProfileVideo = {
  videoUrl: string;
  caption: string;
  postedAt: string | null;
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

function getAuthorProfileFromVideoItem(item: Record<string, unknown>) {
  const authorMeta = getAuthorMeta(item);
  if (!authorMeta) {
    return { displayName: null, followers: 0 };
  }

  const nickName =
    typeof authorMeta.nickName === "string" ? authorMeta.nickName.trim() : "";
  const name =
    typeof authorMeta.name === "string" ? authorMeta.name.trim() : "";

  return {
    displayName: nickName || name || null,
    followers: numberOrZero(
      authorMeta.fans ?? authorMeta.followerCount ?? authorMeta.followers,
    ),
  };
}

function getAuthorUsernameFromVideoItem(
  item: Record<string, unknown>,
): string | null {
  const authorMeta = getAuthorMeta(item);
  if (!authorMeta) return null;

  const uniqueId =
    typeof authorMeta.uniqueId === "string"
      ? authorMeta.uniqueId
      : typeof authorMeta.name === "string"
        ? authorMeta.name
        : null;

  if (!uniqueId) return null;

  const normalized = uniqueId.replace(/^@+/, "").trim().toLowerCase();
  return normalized || null;
}

export async function fetchTikTokVideoData(
  videoUrl: string,
): Promise<TikTokVideoData> {
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
  const authorProfile = getAuthorProfileFromVideoItem(item);

  return {
    views: numberOrZero(item.playCount),
    likes: numberOrZero(item.diggCount),
    comments: numberOrZero(item.commentCount),
    shares: numberOrZero(item.shareCount),
    saves: numberOrZero(item.collectCount),
    authorUsername: getAuthorUsernameFromVideoItem(item),
    authorDisplayName: authorProfile.displayName,
    authorFollowers: authorProfile.followers,
  };
}

export async function fetchTikTokMetrics(videoUrl: string): Promise<TikTokMetrics> {
  const data = await fetchTikTokVideoData(videoUrl);
  return {
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
  };
}

function normalizeInstagramUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.replace(/^@+/, "").trim().toLowerCase();
  return normalized || null;
}

function getInstagramViews(item: Record<string, unknown>): number {
  const viewCount = numberOrZero(item.videoViewCount);
  if (viewCount > 0) return viewCount;

  return numberOrZero(item.videoPlayCount);
}

function getInstagramErrorMessage(item: Record<string, unknown>): string {
  const error = typeof item.error === "string" ? item.error.trim() : "";

  switch (error) {
    case "not_found":
      return "Instagram post not found.";
    case "private":
      return "This Instagram account is private.";
    default:
      return typeof item.errorDescription === "string" && item.errorDescription.trim()
        ? item.errorDescription
        : error
          ? error
          : "No metrics found for this Instagram URL.";
  }
}

export async function fetchInstagramVideoData(
  videoUrl: string,
): Promise<TikTokVideoData> {
  const token = getApifyToken();
  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${INSTAGRAM_REEL_ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: [videoUrl.trim()],
        resultsLimit: 1,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseApifyError(response.status, body));
  }

  const items = (await response.json()) as Array<Record<string, unknown>>;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No metrics found for this Instagram URL.");
  }

  const item = items[0];

  if (item.error) {
    throw new Error(getInstagramErrorMessage(item));
  }

  const hasMetrics =
    getInstagramViews(item) > 0 ||
    numberOrZero(item.likesCount) > 0 ||
    numberOrZero(item.commentsCount) > 0;

  if (!normalizeInstagramUsername(item.ownerUsername) && !hasMetrics) {
    throw new Error("No metrics found for this Instagram URL.");
  }

  const ownerFullName =
    typeof item.ownerFullName === "string" ? item.ownerFullName.trim() : "";

  return {
    views: getInstagramViews(item),
    likes: numberOrZero(item.likesCount),
    comments: numberOrZero(item.commentsCount),
    shares: 0,
    saves: 0,
    authorUsername: normalizeInstagramUsername(item.ownerUsername),
    authorDisplayName: ownerFullName || null,
    authorFollowers: 0,
  };
}

export async function fetchInstagramMetrics(
  videoUrl: string,
): Promise<TikTokMetrics> {
  const data = await fetchInstagramVideoData(videoUrl);
  return {
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
  };
}

export async function fetchVideoDataFromUrl(
  videoUrl: string,
): Promise<PlatformVideoData> {
  const platform = detectVideoPlatform(videoUrl);

  if (platform === "Instagram") {
    return {
      ...(await fetchInstagramVideoData(videoUrl)),
      platform,
    };
  }

  if (platform === "TikTok") {
    return {
      ...(await fetchTikTokVideoData(videoUrl)),
      platform,
    };
  }

  throw new Error(
    "Unsupported video URL. Paste a TikTok or Instagram Reel/video link.",
  );
}

export async function fetchVideoMetricsFromUrl(
  videoUrl: string,
): Promise<TikTokMetrics> {
  const data = await fetchVideoDataFromUrl(videoUrl);
  return {
    views: data.views,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
  };
}

function getAuthorMeta(item: Record<string, unknown>) {
  const authorMeta = item.authorMeta;

  if (!authorMeta || typeof authorMeta !== "object") {
    return null;
  }

  return authorMeta as Record<string, unknown>;
}

function getTikTokProfileErrorMessage(item: Record<string, unknown>) {
  const errorCode = String(item.errorCode ?? "");

  switch (errorCode) {
    case "NOT_FOUND":
    case "SEARCH_QUERY_PROFILE_NOT_FOUND":
      return "TikTok profile not found.";
    case "PROFILE_PRIVATE":
      return "This TikTok profile is private.";
    case "PROFILE_EMPTY":
      return "TikTok profile has no public videos to read.";
    default:
      return typeof item.error === "string" && item.error.trim()
        ? item.error
        : "Could not fetch TikTok profile.";
  }
}

export async function fetchTikTokProfile(
  username: string,
): Promise<TikTokProfileData> {
  const token = getApifyToken();
  const normalizedUsername = username.replace(/^@+/, "").trim().toLowerCase();

  if (!normalizedUsername) {
    throw new Error("TikTok username is required.");
  }

  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${TIKTOK_PROFILE_ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profiles: [normalizedUsername],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseApifyError(response.status, body));
  }

  const items = (await response.json()) as Array<Record<string, unknown>>;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("TikTok profile not found.");
  }

  for (const item of items) {
    if (item.errorCode || item.error) {
      throw new Error(getTikTokProfileErrorMessage(item));
    }
  }

  const authorMeta = items
    .map((item) => getAuthorMeta(item))
    .find((meta) => meta != null);

  if (!authorMeta) {
    throw new Error("TikTok profile not found.");
  }

  const nickName =
    typeof authorMeta.nickName === "string" ? authorMeta.nickName.trim() : "";
  const name =
    typeof authorMeta.name === "string" ? authorMeta.name.trim() : "";

  return {
    followers: numberOrZero(
      authorMeta.fans ?? authorMeta.followerCount ?? authorMeta.followers,
    ),
    name: nickName || name || null,
  };
}

function getNestedNumber(
  item: Record<string, unknown>,
  key: string,
): number {
  const stats = item.stats;
  if (stats && typeof stats === "object") {
    return numberOrZero((stats as Record<string, unknown>)[key]);
  }

  return 0;
}

function getCaptionFromVideoItem(item: Record<string, unknown>): string {
  const text =
    typeof item.text === "string"
      ? item.text.trim()
      : typeof item.desc === "string"
        ? item.desc.trim()
        : typeof item.description === "string"
          ? item.description.trim()
          : "";

  const hashtagParts: string[] = [];
  if (Array.isArray(item.hashtags)) {
    for (const tag of item.hashtags) {
      if (tag && typeof tag === "object") {
        const name = (tag as Record<string, unknown>).name;
        if (typeof name === "string" && name.trim()) {
          hashtagParts.push(`#${name.trim().toLowerCase()}`);
        }
      }
    }
  }

  return [text, ...hashtagParts].filter(Boolean).join(" ").trim();
}

function getVideoUrlFromItem(
  item: Record<string, unknown>,
  fallbackUsername?: string,
): string | null {
  const direct =
    typeof item.webVideoUrl === "string"
      ? item.webVideoUrl.trim()
      : typeof item.videoUrl === "string"
        ? item.videoUrl.trim()
        : typeof item.url === "string"
          ? item.url.trim()
          : null;

  if (direct) return direct;

  const id = item.id != null ? String(item.id).trim() : "";
  if (!id) return null;

  const authorMeta = getAuthorMeta(item);
  const username =
    (typeof authorMeta?.uniqueId === "string" && authorMeta.uniqueId.trim()) ||
    (typeof authorMeta?.name === "string" && authorMeta.name.trim()) ||
    fallbackUsername ||
    "";

  if (!username) return null;

  return `https://www.tiktok.com/@${username.replace(/^@+/, "")}/video/${id}`;
}

function parseTikTokProfileVideoItem(
  item: Record<string, unknown>,
  fallbackUsername?: string,
): TikTokProfileVideo | null {
  const videoUrl = getVideoUrlFromItem(item, fallbackUsername);
  if (!videoUrl) return null;

  const caption = getCaptionFromVideoItem(item);

  let postedAt: string | null = null;
  if (typeof item.createTimeISO === "string" && item.createTimeISO.trim()) {
    postedAt = item.createTimeISO;
  } else if (typeof item.createTime === "number" && Number.isFinite(item.createTime)) {
    postedAt = new Date(item.createTime * 1000).toISOString();
  }

  return {
    videoUrl,
    caption,
    postedAt,
    views: numberOrZero(item.playCount) || getNestedNumber(item, "playCount"),
    likes: numberOrZero(item.diggCount) || getNestedNumber(item, "diggCount"),
    comments: numberOrZero(item.commentCount) || getNestedNumber(item, "commentCount"),
    shares: numberOrZero(item.shareCount) || getNestedNumber(item, "shareCount"),
    saves: numberOrZero(item.collectCount) || getNestedNumber(item, "collectCount"),
  };
}

async function runTikTokProfileScraper(
  normalizedUsername: string,
  resultsPerPage: number,
): Promise<Array<Record<string, unknown>>> {
  const token = getApifyToken();
  const response = await fetch(
    `${APIFY_BASE_URL}/acts/${TIKTOK_PROFILE_ACTOR}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profiles: [normalizedUsername],
        resultsPerPage,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseApifyError(response.status, body));
  }

  const items = (await response.json()) as Array<Record<string, unknown>>;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("TikTok profile not found.");
  }

  for (const item of items) {
    if (item.errorCode || item.error) {
      throw new Error(getTikTokProfileErrorMessage(item));
    }
  }

  return items;
}

export async function fetchTikTokProfileVideos(
  username: string,
  options?: { limit?: number },
): Promise<{
  videos: TikTokProfileVideo[];
  displayName: string | null;
  followers: number;
}> {
  const normalizedUsername = username.replace(/^@+/, "").trim().toLowerCase();

  if (!normalizedUsername) {
    throw new Error("TikTok username is required.");
  }

  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 50);
  const items = await runTikTokProfileScraper(normalizedUsername, limit);

  const authorMeta = items
    .map((item) => getAuthorMeta(item))
    .find((meta) => meta != null);

  const nickName =
    typeof authorMeta?.nickName === "string" ? authorMeta.nickName.trim() : "";
  const name =
    typeof authorMeta?.name === "string" ? authorMeta.name.trim() : "";

  const videos = items
    .map((item) => parseTikTokProfileVideoItem(item, normalizedUsername))
    .filter((video): video is TikTokProfileVideo => video != null);

  return {
    videos,
    displayName: nickName || name || null,
    followers: numberOrZero(
      authorMeta?.fans ?? authorMeta?.followerCount ?? authorMeta?.followers,
    ),
  };
}
