"use client";

import { refreshDashboardVideoMetrics } from "@/app/actions/videos";
import { useLanguage } from "@/components/i18n/language-provider";
import { RefreshVideosButton } from "@/components/videos/refresh-videos-button";

type DashboardRefreshVideosProps = {
  campaignIds: string[];
  hasVideos: boolean;
};

export function DashboardRefreshVideos({
  campaignIds,
  hasVideos,
}: DashboardRefreshVideosProps) {
  const { t } = useLanguage();

  return (
    <RefreshVideosButton
      disabled={!hasVideos}
      label={t("dashboard.refreshVideos")}
      refreshingLabel={t("dashboard.refreshingVideos")}
      refreshAction={() => refreshDashboardVideoMetrics(campaignIds)}
    />
  );
}
