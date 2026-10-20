"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Route-level error boundary. Copy is bilingual because this component runs
 * on the client and cannot read the locale cookie on the server.
 */
export default function WeddingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the digest in the console for support; never log user data.
    console.error("[wedding]", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        Terjadi kesalahan. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-olive-700"
      >
        <RefreshCw className="size-4" aria-hidden />
        Try again · Coba lagi
      </button>
    </div>
  );
}
