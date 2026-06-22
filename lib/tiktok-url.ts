function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return null;
  }
}

export function isTikTokUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");
  } catch {
    return false;
  }
}

export function extractTikTokUsernameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(/\/@([^/]+)\/video\//i);
    if (!match?.[1]) return null;

    const username = decodeURIComponent(match[1]).replace(/^@+/, "").trim().toLowerCase();
    return username || null;
  } catch {
    return null;
  }
}

export function parseTikTokVideoUrls(text: string): {
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
    if (!url || !isTikTokUrl(url)) {
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
