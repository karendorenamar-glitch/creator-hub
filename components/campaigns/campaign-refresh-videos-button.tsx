"use client";

import { refreshCampaignVideoMetrics } from "@/app/actions/videos";
import { useLanguage } from "@/components/i18n/language-provider";
import { RefreshVideosButton } from "@/components/videos/refresh-videos-button";

type CampaignRefreshVideosButtonProps = {
  campaignId: string;
  videoCount: number;
};

export function CampaignRefreshVideosButton({
  campaignId,
  videoCount,
}: CampaignRefreshVideosButtonProps) {
  const { t } = useLanguage();

  return (
    <RefreshVideosButton
      disabled={videoCount === 0}
      label={t("campaign.refreshVideos")}
      refreshingLabel={t("dashboard.refreshingVideos")}
      refreshAction={() => refreshCampaignVideoMetrics(campaignId)}
    />
  );
}
