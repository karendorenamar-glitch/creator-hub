import Link from "next/link";
import { Lock } from "lucide-react";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

/**
 * Shown when the wedding's subscription is not active. Writes are blocked by
 * RLS either way; this only explains why the page looks empty.
 */
export function SubscriptionNotice({
  active,
  copy,
}: {
  active: boolean;
  copy: ModuleCopy;
}) {
  if (active) return null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-white p-2 text-amber-600">
          <Lock className="size-4" aria-hidden />
        </span>
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-ink">{copy.errors.subscriptionRequired}</p>
        </div>
      </div>
      <Link
        href="/wedding/billing"
        className="rounded-xl bg-olive-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-700"
      >
        {copy.errors.activate}
      </Link>
    </div>
  );
}
