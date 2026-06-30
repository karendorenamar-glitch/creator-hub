import { normalizeCreatorPlatformUsername } from "@/lib/utils";

export const MAX_DISCOVER_CREATORS = 20;
export const MAX_DISCOVER_KEYWORDS = 5;
export const DISCOVER_PROFILE_VIDEO_LIMIT = 10;

export type DiscoverMatchVideo = {
  videoUrl: string;
  caption: string;
  postedAt: string | null;
  views: number;
  matchScore: number;
  matchReasons: string[];
};

export type DiscoverCreatorResult = {
  username: string;
  displayName: string | null;
  error?: string;
  matches: DiscoverMatchVideo[];
};

function normalizeUrlCandidate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return null;
  }
}

export function buildDiscoverCreatorHandlesText(
  creators: Array<{
    platform: string;
    tiktok_username: string | null;
  }>,
): string {
  const handles: string[] = [];
  const seen = new Set<string>();

  for (const creator of creators) {
    if (creator.platform.trim().toLowerCase() !== "tiktok") continue;

    const username = normalizeCreatorPlatformUsername(creator.tiktok_username);
    if (!username || seen.has(username)) continue;

    seen.add(username);
    handles.push(`@${username}`);
  }

  return handles.join("\n");
}

export function parseTikTokCreatorHandles(text: string): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const candidate = (line.split(/[,\t]/)[0] ?? line).trim();
    if (!candidate) continue;

    let username: string | null = null;
    const url = normalizeUrlCandidate(candidate);

    if (url) {
      try {
        const { pathname } = new URL(url);
        const match = pathname.match(/\/@([^/]+)/i);
        if (match?.[1]) {
          username = normalizeCreatorPlatformUsername(match[1]);
        }
      } catch {
        username = null;
      }
    }

    if (!username) {
      username = normalizeCreatorPlatformUsername(candidate);
    }

    if (!username) {
      invalid.push(candidate);
      continue;
    }

    if (seen.has(username)) continue;
    seen.add(username);
    valid.push(username);
  }

  return { valid, invalid };
}

export function parseDiscoverKeywords(text: string): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const part of text.split(/[\n,]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const bare = trimmed.replace(/^#+/, "").toLowerCase();
    if (!bare || seen.has(bare)) continue;

    seen.add(bare);
    keywords.push(trimmed.startsWith("#") ? `#${bare}` : bare);
  }

  return keywords;
}

export function scoreVideoKeywordMatch(
  caption: string,
  keywords: string[],
): { score: number; reasons: string[] } {
  const haystack = caption.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const keyword of keywords) {
    const bare = keyword.replace(/^#+/, "").toLowerCase();
    if (!bare) continue;

    const asHashtag = `#${bare}`;

    if (haystack.includes(asHashtag)) {
      score += 3;
      reasons.push(`hashtag:${asHashtag}`);
    } else if (haystack.includes(bare)) {
      score += 1;
      reasons.push(`caption:${bare}`);
    }
  }

  return { score, reasons };
}

export function isVideoWithinDateRange(
  postedAt: string | null,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!postedAt) return true;

  const timestamp = Date.parse(postedAt);
  if (Number.isNaN(timestamp)) return true;

  if (dateFrom) {
    const from = Date.parse(dateFrom);
    if (!Number.isNaN(from) && timestamp < from) return false;
  }

  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    if (timestamp > end.getTime()) return false;
  }

  return true;
}
