"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  dismissTutorial,
  getTutorialProgress,
  hasViewedTutorialPerformance,
  isTutorialDismissed,
  type WorkspaceTutorialStepId,
  type WorkspaceTutorialUsage,
} from "@/lib/workspace-tutorial";
import { cn } from "@/lib/utils";

type WorkspaceTutorialProps = {
  orgId: string;
  usage: WorkspaceTutorialUsage;
  firstCampaignId: string | null;
  onCreateCampaign: () => void;
};

const STEP_ORDER: WorkspaceTutorialStepId[] = [
  "campaign",
  "content",
  "performance",
];

export function WorkspaceTutorial({
  orgId,
  usage,
  firstCampaignId,
  onCreateCampaign,
}: WorkspaceTutorialProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [performanceViewed, setPerformanceViewed] = useState(false);

  useEffect(() => {
    if (isTutorialDismissed(orgId)) return;

    setPerformanceViewed(hasViewedTutorialPerformance(orgId));
    setVisible(true);
  }, [orgId]);

  const progress = getTutorialProgress(usage, performanceViewed);

  useEffect(() => {
    if (!visible || progress.allComplete) return;
    setPerformanceViewed(hasViewedTutorialPerformance(orgId));
  }, [orgId, progress.allComplete, usage, visible]);

  if (!visible || progress.allComplete) {
    return null;
  }

  function handleDismiss() {
    dismissTutorial(orgId);
    setVisible(false);
  }

  function getStepTitle(stepId: WorkspaceTutorialStepId) {
    if (stepId === "campaign") return t("tutorial.stepCampaignTitle");
    if (stepId === "content") return t("tutorial.stepContentTitle");
    return t("tutorial.stepPerformanceTitle");
  }

  function getStepDescription(stepId: WorkspaceTutorialStepId) {
    if (stepId === "campaign") return t("tutorial.stepCampaignDescription");
    if (stepId === "content") return t("tutorial.stepContentDescription");
    return t("tutorial.stepPerformanceDescription");
  }

  function renderStepAction(stepId: WorkspaceTutorialStepId, completed: boolean) {
    if (completed) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {t("tutorial.stepDone")}
        </span>
      );
    }

    if (stepId === "campaign") {
      return (
        <button
          type="button"
          onClick={onCreateCampaign}
          className="text-xs font-medium text-kefoo-500 transition-colors hover:text-kefoo-400"
        >
          {t("tutorial.actionCreateCampaign")}
        </button>
      );
    }

    if (!firstCampaignId) {
      return (
        <span className="text-xs text-neutral-500">
          {t("tutorial.actionNeedsCampaign")}
        </span>
      );
    }

    if (stepId === "content") {
      return (
        <Link
          href={`/campaigns/${firstCampaignId}?view=content`}
          className="text-xs font-medium text-kefoo-500 transition-colors hover:text-kefoo-400"
        >
          {t("tutorial.actionOpenExecution")}
        </Link>
      );
    }

    return (
      <Link
        href={`/campaigns/${firstCampaignId}?view=performance`}
        className="text-xs font-medium text-kefoo-500 transition-colors hover:text-kefoo-400"
      >
        {t("tutorial.actionOpenPerformance")}
      </Link>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-kefoo-200/80 bg-gradient-to-br from-kefoo-50 via-white to-amber-50/60 p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/80 hover:text-neutral-600"
        aria-label={t("tutorial.dismiss")}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-5 pr-8 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kefoo-400 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900">
              {t("tutorial.title")}
            </h2>
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-kefoo-600 ring-1 ring-kefoo-200">
              {t("tutorial.progress", {
                done: String(progress.completedCount),
                total: String(progress.totalSteps),
              })}
            </span>
          </div>
          <p className="mb-5 max-w-2xl text-sm text-neutral-600">
            {t("tutorial.description")}
          </p>

          <ol className="space-y-3">
            {STEP_ORDER.map((stepId, index) => {
              const step = progress.steps.find((item) => item.id === stepId);
              const completed = step?.completed ?? false;
              const isCurrent =
                !completed &&
                progress.steps
                  .slice(0, index)
                  .every((item) => item.completed);

              return (
                <li
                  key={stepId}
                  className={cn(
                    "flex gap-3 rounded-xl border bg-white/80 p-3.5 transition-colors",
                    completed
                      ? "border-emerald-200/80"
                      : isCurrent
                        ? "border-kefoo-300/80 shadow-sm"
                        : "border-neutral-200/80",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      completed
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-kefoo-400 text-white"
                          : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {completed ? <Check className="h-4 w-4" /> : index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-900">
                        {getStepTitle(stepId)}
                      </p>
                      {renderStepAction(stepId, completed)}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      {getStepDescription(stepId)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            onClick={handleDismiss}
            className="mt-4 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            {t("tutorial.hide")}
          </button>
        </div>
      </div>
    </section>
  );
}
