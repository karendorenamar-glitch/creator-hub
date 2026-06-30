"use client";

import { ListOrdered } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { CampaignExecutionTrackerPanel } from "@/components/campaigns/campaign-execution-tracker-panel";
import { CampaignVideosPanel } from "@/components/campaigns/campaign-videos-panel";
import type { CampaignDetail, Creator } from "@/types/database";

type CampaignContentPanelProps = {
  campaign: CampaignDetail;
  creators: Creator[];
  canEdit?: boolean;
};

const STEP_KEYS = [
  "campaign.content.step1",
  "campaign.content.step2",
  "campaign.content.step3",
] as const;

export function CampaignContentPanel({
  campaign,
  creators,
  canEdit = true,
}: CampaignContentPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          {t("campaign.content.title")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("campaign.content.description")}
        </p>
      </div>

      <section className="rounded-xl border border-kefoo-200 bg-kefoo-50/70 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-kefoo-950">
          <ListOrdered className="h-4 w-4 shrink-0 text-kefoo-500" />
          {t("campaign.content.howItWorks")}
        </div>
        <ol className="space-y-2.5">
          {STEP_KEYS.map((key, index) => (
            <li key={key} className="flex gap-3 text-sm leading-relaxed text-kefoo-950">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-kefoo-600 ring-1 ring-kefoo-200">
                {index + 1}
              </span>
              <span className="pt-0.5">{t(key)}</span>
            </li>
          ))}
        </ol>
      </section>

      <CampaignExecutionTrackerPanel
        campaign={campaign}
        creators={creators}
        embedded
        canEdit={canEdit}
      />

      <CampaignVideosPanel campaign={campaign} embedded canEdit={canEdit} />
    </div>
  );
}
