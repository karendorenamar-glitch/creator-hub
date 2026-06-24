"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/plan-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import { formatTrialDate } from "@/lib/plan";

export function TrialStatusBanner() {
  const { isFreeTrial, isTrialExpired, trialEndsAt } = usePlan();
  const { t } = useLanguage();

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
            {t("trial.expired", {
              date: trialEndsAt
                ? t("trial.expiredDate", {
                    date: formatTrialDate(trialEndsAt),
                  })
                : "",
            })}
          </p>
          <Link
            href="/checkout/starter"
            className="inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            {t("common.upgradePlan")}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
