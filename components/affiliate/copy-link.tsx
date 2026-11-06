"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="break-all rounded-lg bg-blush/30 px-2 py-1 text-xs text-ink">{url}</code>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-rosewood/40 px-3 py-1 text-[11px] text-rosewood hover:bg-blush/40"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
