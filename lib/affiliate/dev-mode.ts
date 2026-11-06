/**
 * Development-only helpers for affiliate testing.
 *
 * Active only when the bundle is a development build AND the page is served
 * from localhost. In a production build NODE_ENV is "production", so the flag
 * is inlined as false and this code path never runs.
 */
export function isLocalDev(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

/** Unique dummy address so repeated dev signups do not collide. */
export function devTestEmail(prefix = "afftest"): string {
  const stamp = Date.now().toString(36);
  return `${prefix}+${stamp}@example.com`;
}

export const DEV_TEST_PASSWORD = "testpass123";
