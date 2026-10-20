"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function CopyLinkButton({
  url,
  copy,
}: {
  url: string;
  copy: ModuleCopy;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50"
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? copy.invitation.copied : copy.invitation.copyLink}
    </button>
  );
}
