"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/plan-provider";
import { formatTrialDate } from "@/lib/plan";

export function TrialStatusBanner() {
  const { isFreeTrial, isTrialExpired, trialEndsAt } = usePlan();

  if (!isFreeTrial && !isTrialExpired) {
    return null;
  }

  if (isTrialExpired) {
    return (
      <div
        role="alert"
        className="border-b border-red-200 bg-red-50 px-4 py-3 sm:px-6 lg:px-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-red-900">
            Free trial ended
            {trialEndsAt ? ` on ${formatTrialDate(trialEndsAt)}` : ""}. Upgrade
            your plan to keep using campaigns, creators, and videos.
          </p>
          <Link
            href="/checkout/starter"
            className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Upgrade plan
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
