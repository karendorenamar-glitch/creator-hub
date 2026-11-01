"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function DebtError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never log debt values, names, or payment details.
    console.error("[debt] route error", error.digest ?? "no-digest");
  }, [error.digest]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        Data belum bisa dimuat
      </h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        Terjadi kesalahan saat membaca ledger. Coba lagi tanpa mengubah data.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
      >
        <RefreshCw className="size-4" aria-hidden /> Coba lagi
      </button>
    </div>
  );
}
