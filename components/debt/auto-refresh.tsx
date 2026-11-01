"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Keeps due dates fresh: refreshes when the tab is focused and every 10 minutes. */
export function DebtAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }

    const interval = window.setInterval(refreshIfVisible, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [router]);

  return null;
}
