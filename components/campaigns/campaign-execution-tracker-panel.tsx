"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, Lightbulb, Link2 } from "lucide-react";
import {
  linkCreatorToCampaign,
  updateCampaignCreatorWorkflowStatus,
} from "@/app/actions/campaigns";
import { createVideoFromUrl } from "@/app/actions/videos";
import { useToast } from "@/components/ui/toast";
import {
  CAMPAIGN_CREATOR_WORKFLOW_STATUSES,
  EXECUTION_TRACKER_STATUS_LABELS,
  EXECUTION_TRACKER_STATUS_SUMMARY,
  type CampaignCreatorWorkflowStatus,
} from "@/lib/campaign-creator-status";
import {
  normalizeVideoPlatform,
  validateVideoUrlForPlatform,
  type VideoPlatform,
} from "@/lib/video-url";
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
import { cn, formatCreatorListUsername } from "@/lib/utils";
import type { CampaignCreator, CampaignDetail, Creator } from "@/types/database";

type CampaignExecutionTrackerPanelProps = {
  campaign: CampaignDetail;
  creators: Creator[];
};

const STATUS_CLASS: Record<CampaignCreatorWorkflowStatus, string> = {
  brief_sent: "border-slate-200 bg-slate-50 text-slate-700",
  waiting_content: "border-amber-200 bg-amber-50 text-amber-800",
  revision: "border-orange-200 bg-orange-50 text-orange-800",
  posted: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const SUMMARY_CLASS: Record<CampaignCreatorWorkflowStatus, string> = {
  brief_sent: "border-slate-200 bg-white text-slate-700",
  waiting_content: "border-amber-200 bg-amber-50/60 text-amber-900",
  revision: "border-orange-200 bg-orange-50/60 text-orange-900",
  posted: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
};

function CreatorAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kefoo-100 text-sm font-semibold text-kefoo-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function creatorPlatform(creator: CampaignCreator): VideoPlatform | null {
  return normalizeVideoPlatform(creator.platform);
}

export function CampaignExecutionTrackerPanel({
  campaign,
  creators,
}: CampaignExecutionTrackerPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [statusByCreator, setStatusByCreator] = useState<
    Record<string, CampaignCreatorWorkflowStatus>
  >({});
  const [videoUrlInputs, setVideoUrlInputs] = useState<Record<string, string>>(
    {},
  );
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [linkingCreatorId, setLinkingCreatorId] = useState<string | null>(null);
  const [addingCreatorId, setAddingCreatorId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [isSavingStatus, startStatusTransition] = useTransition();
  const [isLinkingVideo, startLinkVideoTransition] = useTransition();
  const [isAddingCreator, startAddCreatorTransition] = useTransition();

  const availableCreators = useMemo(() => {
    const existing = new Set(campaign.creators.map((creator) => String(creator.id)));
    return creators.filter((creator) => !existing.has(String(creator.id)));
  }, [campaign.creators, creators]);

  const videoByCreator = useMemo(() => {
    const map = new Map<string, (typeof campaign.videos)[number]>();

    for (const video of campaign.videos) {
      if (!map.has(video.creator_id)) {
        map.set(video.creator_id, video);
      }
    }

    return map;
  }, [campaign]);

  const statusCounts = useMemo(() => {
    const counts: Record<CampaignCreatorWorkflowStatus, number> = {
      brief_sent: 0,
      waiting_content: 0,
      revision: 0,
      posted: 0,
    };

    for (const creator of campaign.creators) {
      const status =
        statusByCreator[creator.id] ??
        creator.workflow_status ??
        "brief_sent";
      counts[status] += 1;
    }

    return counts;
  }, [campaign.creators, statusByCreator]);

  function handleStatusChange(
    creatorId: string,
    status: CampaignCreatorWorkflowStatus,
  ) {
    const previous = statusByCreator[creatorId] ?? "brief_sent";
    setStatusByCreator((current) => ({ ...current, [creatorId]: status }));
    setSavingStatusId(creatorId);

    startStatusTransition(async () => {
      const result = await updateCampaignCreatorWorkflowStatus(
        campaign.id,
        creatorId,
        status,
      );

      setSavingStatusId(null);

      if (result.error) {
        setStatusByCreator((current) => ({
          ...current,
          [creatorId]: previous,
        }));
        showError(result.error);
        return;
      }

      showSuccess("Creator status updated.");
      router.refresh();
    });
  }

  function handleLinkVideo(creator: CampaignCreator) {
    const platform = creatorPlatform(creator);

    if (!platform) {
      showError("This creator's platform must be TikTok or Instagram.");
      return;
    }

    const videoUrl = (videoUrlInputs[creator.id] ?? "").trim();

    if (!videoUrl) {
      showError("Paste a video link before saving.");
      return;
    }

    const platformError = validateVideoUrlForPlatform(videoUrl, platform);

    if (platformError) {
      showError(platformError);
      return;
    }

    setLinkingCreatorId(creator.id);

    startLinkVideoTransition(async () => {
      const currentStatus =
        statusByCreator[creator.id] ??
        creator.workflow_status ??
        "brief_sent";

      if (currentStatus !== "posted") {
        const statusResult = await updateCampaignCreatorWorkflowStatus(
          campaign.id,
          creator.id,
          "posted",
        );

        if (statusResult.error) {
          setLinkingCreatorId(null);
          showError(statusResult.error);
          return;
        }

        setStatusByCreator((current) => ({
          ...current,
          [creator.id]: "posted",
        }));
      }

      const result = await createVideoFromUrl({
        creator_id: creator.id,
        video_url: videoUrl,
        platform,
        campaign_id: campaign.id,
        import_metrics: true,
        auto_create_creator: false,
      });

      setLinkingCreatorId(null);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Video linked and metrics imported.");
      router.refresh();
    });
  }

  function handleAddCreator() {
    const creatorId = selectedCreatorId.trim();

    if (!creatorId) {
      showError("Select a creator first.");
      return;
    }

    setAddingCreatorId(creatorId);

    startAddCreatorTransition(async () => {
      const result = await linkCreatorToCampaign(campaign.id, creatorId);

      setAddingCreatorId(null);

      if (result.error) {
        showError(result.error);
        return;
      }

      setSelectedCreatorId("");
      showSuccess("Creator added to campaign.");
      router.refresh();
    });
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">
            Execution tracker
          </h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Track each creator from brief through upload. Paste a video link when
          marked Uploaded to add it to this campaign.
        </p>
      </div>

      <div className="mb-6 flex gap-2.5 rounded-xl border border-kefoo-200 bg-kefoo-50 px-4 py-3 text-sm leading-relaxed text-kefoo-950">
        <Lightbulb
          className="mt-0.5 h-4 w-4 shrink-0 text-kefoo-400"
          aria-hidden
        />
        <p>
          <span className="font-semibold">Quick tip:</span> Once you paste a
          video link for a creator and mark them Uploaded, their video
          automatically appears in Campaign performance and counts toward your
          metrics.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedCreatorId}
            onChange={(event) => setSelectedCreatorId(event.target.value)}
            disabled={isAddingCreator}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-sm"
            aria-label="Add creator to campaign"
          >
            <option value="">
              {availableCreators.length === 0
                ? "All creators already added"
                : "Add a creator…"}
            </option>
            {availableCreators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name} · {formatCreatorListUsername(creator)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddCreator}
            disabled={
              isAddingCreator ||
              !selectedCreatorId ||
              availableCreators.length === 0 ||
              addingCreatorId === selectedCreatorId
            }
            className="inline-flex items-center justify-center rounded-lg bg-kefoo-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingCreator && addingCreatorId === selectedCreatorId
              ? "Adding..."
              : "Add creator"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {EXECUTION_TRACKER_STATUS_SUMMARY.map(({ status, label }) => (
          <article
            key={status}
            className={cn(
              "rounded-xl border px-4 py-4 shadow-sm",
              SUMMARY_CLASS[status],
            )}
          >
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {statusCounts[status]}
            </p>
          </article>
        ))}
      </div>

      {campaign.creators.length === 0 ? (
        <DataTable>
          <EmptyState
            title="No creators linked yet"
            description="Add creators in Edit campaign, or upload videos to start tracking execution."
          />
        </DataTable>
      ) : (
        <DataTable>
          <DataTableElement>
            <DataTableHead>
              <DataTableHeaderCell>Creator</DataTableHeaderCell>
              <DataTableHeaderCell>Profile</DataTableHeaderCell>
              <DataTableHeaderCell>Platform</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Video link</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {campaign.creators.map((creator) => {
                const workflowStatus =
                  statusByCreator[creator.id] ??
                  creator.workflow_status ??
                  "brief_sent";
                const linkedVideo = videoByCreator.get(creator.id);
                const videoInput =
                  videoUrlInputs[creator.id] ?? linkedVideo?.video_url ?? "";
                const isUploaded = workflowStatus === "posted";
                const isLinking =
                  isLinkingVideo && linkingCreatorId === creator.id;
                const platform = creatorPlatform(creator);

                return (
                  <DataTableRow key={creator.id}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <CreatorAvatar name={creator.name} />
                        <Link
                          href={`/creators/${creator.id}`}
                          className="font-medium text-kefoo-600 hover:text-kefoo-500"
                        >
                          {creator.name}
                        </Link>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {formatCreatorListUsername(creator)}
                    </DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {creator.platform}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <select
                        value={workflowStatus}
                        disabled={
                          isSavingStatus && savingStatusId === creator.id
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            creator.id,
                            event.target.value as CampaignCreatorWorkflowStatus,
                          )
                        }
                        aria-label={`Execution status for ${creator.name}`}
                        className={cn(
                          "w-full min-w-[10rem] rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-kefoo-500/20 disabled:cursor-wait disabled:opacity-60",
                          STATUS_CLASS[workflowStatus],
                        )}
                      >
                        {CAMPAIGN_CREATOR_WORKFLOW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {EXECUTION_TRACKER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </DataTableCell>
                    <DataTableCell>
                      {isUploaded ? (
                        <div className="flex min-w-[16rem] flex-col gap-2">
                          <input
                            type="url"
                            value={videoInput}
                            placeholder={
                              platform === "Instagram"
                                ? "Paste Reels URL"
                                : "Paste TikTok video URL"
                            }
                            onChange={(event) =>
                              setVideoUrlInputs((current) => ({
                                ...current,
                                [creator.id]: event.target.value,
                              }))
                            }
                            aria-label={`Video link for ${creator.name}`}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLinkVideo(creator)}
                              disabled={isLinking || !videoInput.trim()}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-kefoo-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {isLinking
                                ? "Importing..."
                                : linkedVideo
                                  ? "Update video"
                                  : "Add & import"}
                            </button>
                            {linkedVideo ? (
                              <a
                                href={linkedVideo.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-kefoo-600 hover:text-kefoo-500"
                              >
                                Open linked video
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : linkedVideo ? (
                        <a
                          href={linkedVideo.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-[14rem] items-center gap-1 truncate text-sm font-medium text-kefoo-600 hover:text-kefoo-500"
                        >
                          <span className="truncate">{linkedVideo.video_url}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Set status to Uploaded
                        </span>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTableElement>
        </DataTable>
      )}
    </section>
  );
}
