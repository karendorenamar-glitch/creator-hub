"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Megaphone } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
} from "@/components/ui/data-table";
import {
  calculateEngagementRate,
  cn,
  formatEngagementRate,
  formatNumber,
} from "@/lib/utils";
import type { CreatorCampaignDetail } from "@/types/database";

type CreatorCampaignsPanelProps = {
  campaigns: CreatorCampaignDetail[];
};

function aggregateCampaignStats(videos: CreatorCampaignDetail["videos"]) {
  return videos.reduce(
    (acc, video) => ({
      views: acc.views + video.views,
      likes: acc.likes + video.likes,
      comments: acc.comments + video.comments,
      shares: acc.shares + video.shares,
      saves: acc.saves + video.saves,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  );
}

export function CreatorCampaignsPanel({ campaigns }: CreatorCampaignsPanelProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  const selectedStats = useMemo(
    () =>
      selectedCampaign
        ? aggregateCampaignStats(selectedCampaign.videos)
        : null,
    [selectedCampaign],
  );

  const selectedEngagementRate =
    selectedStats && selectedStats.views > 0
      ? calculateEngagementRate(
          selectedStats.views,
          selectedStats.likes,
          selectedStats.comments,
          selectedStats.shares,
          selectedStats.saves,
        )
      : 0;

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Campaigns</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} joined
            — select one to view video performance.
          </p>
        </div>
        <div className="rounded-xl border border-kefoo-200 bg-kefoo-50 px-5 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-kefoo-700">
            Total joined
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-kefoo-800">
            {campaigns.length}
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <DataTable>
          <EmptyState
            title="No campaigns yet"
            description="This creator has not joined any campaigns."
          />
        </DataTable>
      ) : (
        <>
          <ul className="mb-6 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {campaigns.map((campaign) => {
              const isSelected = selectedCampaignId === campaign.id;
              const stats = aggregateCampaignStats(campaign.videos);

              return (
                <li key={campaign.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCampaignId((current) =>
                        current === campaign.id ? null : campaign.id,
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors",
                      isSelected
                        ? "bg-kefoo-50"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {campaign.name}
                        </p>
                        <CampaignStatusBadge status={campaign.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {campaign.client_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {campaign.videos.length} video
                        {campaign.videos.length === 1 ? "" : "s"}
                        {stats.views > 0
                          ? ` · ${formatNumber(stats.views)} views`
                          : ""}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                        isSelected && "rotate-90 text-kefoo-600",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedCampaign ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">
                    {selectedCampaign.name}
                  </h4>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Video performance for this campaign
                  </p>
                </div>
                <Link
                  href={`/campaigns/${selectedCampaign.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-kefoo-600 hover:text-kefoo-500"
                >
                  Open campaign
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              {selectedStats && selectedStats.views > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Views", value: formatNumber(selectedStats.views) },
                    { label: "Likes", value: formatNumber(selectedStats.likes) },
                    {
                      label: "Comments",
                      value: formatNumber(selectedStats.comments),
                    },
                    { label: "Shares", value: formatNumber(selectedStats.shares) },
                    { label: "Saves", value: formatNumber(selectedStats.saves) },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                    >
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {value}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 sm:col-span-2 lg:col-span-1">
                    <p className="text-xs font-medium text-slate-500">ER%</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {formatEngagementRate(selectedEngagementRate)}
                    </p>
                  </div>
                </div>
              ) : null}

              {selectedCampaign.videos.length === 0 ? (
                <DataTable>
                  <EmptyState
                    title="No videos in this campaign"
                    description="Videos linked to this campaign will appear here with full metrics."
                  />
                </DataTable>
              ) : (
                <DataTable>
                  <DataTableElement>
                    <DataTableHead>
                      <DataTableHeaderCell>Video</DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        Views
                      </DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        Likes
                      </DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        Comments
                      </DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        Shares
                      </DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        Saves
                      </DataTableHeaderCell>
                      <DataTableHeaderCell className="text-right">
                        ER%
                      </DataTableHeaderCell>
                    </DataTableHead>
                    <DataTableBody>
                      {selectedCampaign.videos.map((video) => (
                        <DataTableRow key={video.id}>
                          <DataTableCell className="max-w-xs">
                            <a
                              href={video.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate font-medium text-kefoo-600 hover:text-kefoo-500"
                            >
                              {video.video_url}
                            </a>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {formatNumber(video.views)}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {formatNumber(video.likes)}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {formatNumber(video.comments)}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {formatNumber(video.shares)}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {formatNumber(video.saves)}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            {video.views > 0
                              ? formatEngagementRate(
                                  calculateEngagementRate(
                                    video.views,
                                    video.likes,
                                    video.comments,
                                    video.shares,
                                    video.saves,
                                  ),
                                )
                              : "—"}
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableElement>
                </DataTable>
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Select a campaign above to view video links and metrics.
            </p>
          )}
        </>
      )}
    </section>
  );
}
