"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/plan-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import { formatTrialDate } from "@/lib/plan";
import type { OrgPlan } from "@/lib/plan";

function getRenewCheckoutPath(plan: OrgPlan) {
  if (plan === "free_trial") {
    return "/checkout/starter";
  }

  return `/checkout/${plan}`;
}

export function TrialStatusBanner() {
  const {
    plan,
    isFreeTrial,
    isAccessLocked,
    isSubscriptionExpired,
    trialEndsAt,
    subscriptionEndsAt,
  } = usePlan();
  const { t } = useLanguage();

  if (!isAccessLocked) {
    return null;
  }

  const endsAt = isSubscriptionExpired ? subscriptionEndsAt : trialEndsAt;
  const messageKey = isSubscriptionExpired ? "subscription.expired" : "trial.expired";

  return (
    <div
      role="alert"
      className="border-b border-red-200 bg-red-50 px-4 py-3 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-red-900">
          {t(messageKey, {
            date: endsAt
              ? t("trial.expiredDate", {
                  date: formatTrialDate(endsAt),
                })
              : "",
          })}
        </p>
        <Link
          href={getRenewCheckoutPath(plan)}
          className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          {isSubscriptionExpired && !isFreeTrial
            ? t("common.renewSubscription")
            : t("common.upgradePlan")}
        </Link>
      </div>
    </div>
  );
}
