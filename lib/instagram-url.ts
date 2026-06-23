function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return null;
  }
}

const RESERVED_PATH_SEGMENTS = new Set([
  "reel",
  "reels",
  "p",
  "tv",
  "stories",
  "explore",
]);

export function isInstagramVideoUrl(url: string): boolean {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  try {
    const { hostname, pathname } = new URL(normalized);
    const isInstagramHost =
      hostname === "instagram.com" || hostname.endsWith(".instagram.com");

    if (!isInstagramHost) return false;

    return /^\/(?:reel|reels|p)\/[^/]+/i.test(pathname);
  } catch {
    return false;
  }
}

export function extractInstagramUsernameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(
      /^\/([^/]+)\/(?:reel|reels|p)\/[^/]+/i,
    );

    if (!match?.[1]) return null;

    const segment = decodeURIComponent(match[1]).replace(/^@+/, "").trim().toLowerCase();

    if (!segment || RESERVED_PATH_SEGMENTS.has(segment)) {
      return null;
    }

    return segment;
  } catch {
    return null;
  }
}

export function parseInstagramVideoUrls(text: string): {
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

    const url = normalizeUrl(candidate);
    if (!url || !isInstagramVideoUrl(url)) {
      invalid.push(candidate);
      continue;
    }

    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push(url);
  }

  return { valid, invalid };
}
