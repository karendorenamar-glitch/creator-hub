"use client";

import { useEffect } from "react";

/**
 * Reloads the page when the deployed build differs from the one this tab was
 * rendered with, so customers never have to clear their cache by hand.
 */
export function VersionGuard({ build }: { build: string }) {
  useEffect(() => {
    if (!build || build === "dev") return;
    let stopped = false;

    async function check() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { build?: string };
        if (data.build && data.build !== build) window.location.reload();
      } catch {
        // Offline or transient failure: try again on the next tick.
      }
    }

    const timer = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [build]);

  return null;
}
