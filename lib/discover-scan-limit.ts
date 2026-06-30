export const DISCOVER_SCAN_COOLDOWN_DAYS = 7;
export const DISCOVER_SCAN_COOLDOWN_MS =
  DISCOVER_SCAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const DISCOVER_SCAN_CONCURRENCY = 3;
export const DISCOVER_SCAN_SECONDS_PER_BATCH = 12;

export type DiscoverScanAvailability = {
  canScan: boolean;
  lastScanAt: string | null;
  nextScanAt: string | null;
  waitMs: number;
  waitSeconds: number;
};

export function estimateDiscoverScanSeconds(creatorCount: number): number {
  const batches = Math.ceil(Math.max(1, creatorCount) / DISCOVER_SCAN_CONCURRENCY);
  return Math.max(8, batches * DISCOVER_SCAN_SECONDS_PER_BATCH);
}

export function resolveDiscoverScanAvailability(
  lastScanAt: string | null | undefined,
  nowMs: number = Date.now(),
): DiscoverScanAvailability {
  if (!lastScanAt) {
    return {
      canScan: true,
      lastScanAt: null,
      nextScanAt: null,
      waitMs: 0,
      waitSeconds: 0,
    };
  }

  const lastMs = new Date(lastScanAt).getTime();
  const nextMs = lastMs + DISCOVER_SCAN_COOLDOWN_MS;

  if (nowMs >= nextMs) {
    return {
      canScan: true,
      lastScanAt,
      nextScanAt: null,
      waitMs: 0,
      waitSeconds: 0,
    };
  }

  const waitMs = nextMs - nowMs;

  return {
    canScan: false,
    lastScanAt,
    nextScanAt: new Date(nextMs).toISOString(),
    waitMs,
    waitSeconds: Math.ceil(waitMs / 1000),
  };
}

export function formatDiscoverScanWaitDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(totalSeconds / 3600);
  if (hours < 48) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.ceil(totalSeconds / 86400);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function formatDiscoverScanCooldownMessage(waitSeconds: number): string {
  const duration = formatDiscoverScanWaitDuration(waitSeconds);
  return `Keyword scan is limited to once per week on Scale. Next scan available in ${duration}.`;
}

export function formatDiscoverScanInProgressMessage(estimatedSeconds: number): string {
  return `Please wait ~${estimatedSeconds} second${estimatedSeconds === 1 ? "" : "s"} while we scan creator profiles for matching keywords.`;
}

export const DISCOVER_WEEKLY_LIMIT_NOTICE =
  "Discover can only be run once a week — use it properly and efficiently.";
