export const SUPPORTED_PLATFORMS = ["TikTok", "Instagram"] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export function isSupportedPlatform(
  value: string | null | undefined,
): value is SupportedPlatform {
  if (!value) return false;

  return SUPPORTED_PLATFORMS.some(
    (platform) => platform.toLowerCase() === value.trim().toLowerCase(),
  );
}
