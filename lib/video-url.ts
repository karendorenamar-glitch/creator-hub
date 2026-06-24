import {
  isInstagramVideoUrl,
  parseInstagramVideoUrls,
} from "@/lib/instagram-url";
import { SUPPORTED_PLATFORMS, type SupportedPlatform } from "@/lib/platforms";
import { isTikTokUrl, parseTikTokVideoUrls } from "@/lib/tiktok-url";

export type VideoPlatform = SupportedPlatform;

export const VIDEO_PLATFORMS = SUPPORTED_PLATFORMS;

export function normalizeVideoPlatform(
  value: string | null | undefined,
): VideoPlatform | null {
  if (!value) return null;

  const match = VIDEO_PLATFORMS.find(
    (platform) => platform.toLowerCase() === value.trim().toLowerCase(),
  );

  return match ?? null;
}

export function validateVideoUrlForPlatform(
  url: string,
  platform: VideoPlatform,
): string | null {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return `${platform} video URL is required.`;
  }

  const detectedPlatform = detectVideoPlatform(trimmedUrl);

  if (!detectedPlatform) {
    return platform === "TikTok"
      ? "Enter a valid TikTok video link (tiktok.com)."
      : "Enter a valid Instagram Reel or video link (instagram.com/reel/ or /p/).";
  }

  if (detectedPlatform !== platform) {
    return `This is a ${detectedPlatform} link. Select ${detectedPlatform} as the platform, or paste a ${platform} link.`;
  }

  return null;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return null;
  }
}

export function detectVideoPlatform(url: string): VideoPlatform | null {
  if (isTikTokUrl(url)) return "TikTok";
  if (isInstagramVideoUrl(url)) return "Instagram";
  return null;
}

export function isSupportedVideoUrl(url: string): boolean {
  return detectVideoPlatform(url) !== null;
}

export function parseVideoUrls(text: string): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!line || line.startsWith("#")) continue;

    const candidate = (line.split(/[,\t]/)[0] ?? line).trim();
    if (!candidate) continue;

    const url = normalizeUrl(candidate);
    if (!url || !isSupportedVideoUrl(url)) {
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

export function parseVideoUrlsForPlatform(
  text: string,
  platform: VideoPlatform,
): {
  valid: string[];
  invalid: string[];
  wrongPlatform: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const wrongPlatform: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    if (!line || line.startsWith("#")) continue;

    const candidate = (line.split(/[,\t]/)[0] ?? line).trim();
    if (!candidate) continue;

    const url = normalizeUrl(candidate);
    if (!url || !isSupportedVideoUrl(url)) {
      invalid.push(candidate);
      continue;
    }

    const detectedPlatform = detectVideoPlatform(url);
    if (detectedPlatform !== platform) {
      wrongPlatform.push(candidate);
      continue;
    }

    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push(url);
  }

  return { valid, invalid, wrongPlatform };
}

/** @deprecated Use parseVideoUrls for TikTok and Instagram links. */
export function parseTikTokOnlyVideoUrls(text: string) {
  return parseTikTokVideoUrls(text);
}

/** @deprecated Use parseVideoUrls for TikTok and Instagram links. */
export function parseInstagramOnlyVideoUrls(text: string) {
  return parseInstagramVideoUrls(text);
}
