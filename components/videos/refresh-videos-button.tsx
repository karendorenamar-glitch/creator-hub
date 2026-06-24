"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type RefreshResult =
  | { error: string }
  | { data: { refreshed: number; failed: number; total: number } };

type RefreshVideosButtonProps = {
  disabled?: boolean;
  label?: string;
  refreshingLabel?: string;
  className?: string;
  refreshAction: () => Promise<RefreshResult>;
};

export function RefreshVideosButton({
  disabled = false,
  label = "Refresh videos",
  refreshingLabel = "Refreshing...",
  className,
  refreshAction,
}: RefreshVideosButtonProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      const result = await refreshAction();

      if ("error" in result && result.error) {
        showError(result.error);
        return;
      }

      if (!("data" in result) || !result.data) {
        showError("Failed to refresh video metrics.");
        return;
      }

      const { refreshed = 0, failed = 0, total = 0 } = result.data;

      if (total === 0) {
        showError("No linked videos to refresh.");
        return;
      }

      if (refreshed === 0 && failed > 0) {
        showError("Failed to refresh video metrics.");
        return;
      }

      if (failed > 0) {
        showSuccess(`Refreshed ${refreshed} of ${total} videos. ${failed} failed.`);
      } else {
        showSuccess(
          total === 1
            ? "Video metrics refreshed."
            : `All ${refreshed} videos refreshed.`,
        );
      }

      router.refresh();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={disabled || isRefreshing}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      {isRefreshing ? refreshingLabel : label}
    </button>
  );
}
