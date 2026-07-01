"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVideoManualMetrics } from "@/app/actions/videos";
import { useLanguage } from "@/components/i18n/language-provider";
import { useToast } from "@/components/ui/toast";
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
  formatEngagementRate,
  formatNumber,
} from "@/lib/utils";
import type { VideoWithCreator } from "@/types/database";

type CampaignCreatorVideosTableProps = {
  videos: VideoWithCreator[];
  creatorPlatform: string;
  allowManualMetrics: boolean;
};

type MetricDraft = {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
};

const METRIC_FIELDS: Array<keyof MetricDraft> = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
];

function toDraft(video: VideoWithCreator): MetricDraft {
  return {
    views: String(video.views),
    likes: String(video.likes),
    comments: String(video.comments),
    shares: String(video.shares),
    saves: String(video.saves),
  };
}

function parseDraft(draft: MetricDraft) {
  return {
    views: Number(draft.views),
    likes: Number(draft.likes),
    comments: Number(draft.comments),
    shares: Number(draft.shares),
    saves: Number(draft.saves),
  };
}

function metricInputClassName() {
  return "w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20";
}

export function CampaignCreatorVideosTable({
  videos,
  creatorPlatform,
  allowManualMetrics,
}: CampaignCreatorVideosTableProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [drafts, setDrafts] = useState<Record<string, MetricDraft>>({});
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    setDrafts(Object.fromEntries(videos.map((video) => [video.id, toDraft(video)])));
  }, [videos]);

  function handleDraftChange(
    videoId: string,
    field: keyof MetricDraft,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,
      [videoId]: {
        ...(current[videoId] ?? {
          views: "0",
          likes: "0",
          comments: "0",
          shares: "0",
          saves: "0",
        }),
        [field]: value,
      },
    }));
  }

  function handleSave(video: VideoWithCreator) {
    const draft = drafts[video.id] ?? toDraft(video);
    const metrics = parseDraft(draft);

    if (METRIC_FIELDS.some((field) => !Number.isFinite(metrics[field]))) {
      showError("Enter valid numbers for all metrics.");
      return;
    }

    setSavingVideoId(video.id);

    startSaveTransition(async () => {
      const result = await updateVideoManualMetrics(video.id, metrics);
      setSavingVideoId(null);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Video metrics updated.");
      router.refresh();
    });
  }

  function hasDraftChanges(video: VideoWithCreator, draft: MetricDraft) {
    const metrics = parseDraft(draft);
    return METRIC_FIELDS.some((field) => metrics[field] !== video[field]);
  }

  if (videos.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="No videos yet"
          description="Videos linked to this campaign from this creator will appear here."
        />
      </DataTable>
    );
  }

  return (
    <div className="space-y-3">
      {allowManualMetrics ? (
        <div
          role="note"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t("campaign.creator.instagramManualMetrics")}
        </div>
      ) : null}

      <DataTable>
        <DataTableElement>
          <DataTableHead>
            <DataTableHeaderCell>Video</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Likes</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Comments</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Shares</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">Saves</DataTableHeaderCell>
            <DataTableHeaderCell className="text-right">ER%</DataTableHeaderCell>
            {allowManualMetrics ? (
              <DataTableHeaderCell className="text-right">Update</DataTableHeaderCell>
            ) : null}
          </DataTableHead>
          <DataTableBody>
            {videos.map((video) => {
              const draft = drafts[video.id] ?? toDraft(video);
              const metrics = parseDraft(draft);
              const isRowSaving = isSaving && savingVideoId === video.id;
              const hasChanges = hasDraftChanges(video, draft);

              return (
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
                    {allowManualMetrics ? (
                      <p className="mt-1 text-xs text-slate-500">{creatorPlatform}</p>
                    ) : null}
                  </DataTableCell>
                  {METRIC_FIELDS.map((field) => (
                    <DataTableCell key={field} className="text-right">
                      {allowManualMetrics ? (
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={draft[field]}
                          onChange={(event) =>
                            handleDraftChange(video.id, field, event.target.value)
                          }
                          className={metricInputClassName()}
                          aria-label={`${field} for ${video.video_url}`}
                        />
                      ) : (
                        formatNumber(video[field])
                      )}
                    </DataTableCell>
                  ))}
                  <DataTableCell className="text-right">
                    {metrics.views > 0
                      ? formatEngagementRate(
                          calculateEngagementRate(
                            metrics.views,
                            metrics.likes,
                            metrics.comments,
                            metrics.shares,
                            metrics.saves,
                          ),
                        )
                      : "—"}
                  </DataTableCell>
                  {allowManualMetrics ? (
                    <DataTableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => handleSave(video)}
                        disabled={isRowSaving || !hasChanges}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRowSaving
                          ? t("campaign.creator.savingMetrics")
                          : t("campaign.creator.saveMetrics")}
                      </button>
                    </DataTableCell>
                  ) : null}
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTableElement>
      </DataTable>
    </div>
  );
}
