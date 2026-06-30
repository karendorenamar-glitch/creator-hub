"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink } from "lucide-react";
import {
  linkCreatorToCampaign,
  updateCampaignCreatorWorkflowStatus,
} from "@/app/actions/campaigns";
import { useToast } from "@/components/ui/toast";
import {
  CAMPAIGN_CREATOR_WORKFLOW_STATUSES,
  EXECUTION_TRACKER_STATUS_LABELS,
  EXECUTION_TRACKER_STATUS_SUMMARY,
  type CampaignCreatorWorkflowStatus,
} from "@/lib/campaign-creator-status";
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
  embedded?: boolean;
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

export function CampaignExecutionTrackerPanel({
  campaign,
  creators,
  embedded = false,
}: CampaignExecutionTrackerPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [statusByCreator, setStatusByCreator] = useState<
    Record<string, CampaignCreatorWorkflowStatus>
  >({});
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [addingCreatorId, setAddingCreatorId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [isSavingStatus, startStatusTransition] = useTransition();
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
      const linkedVideo = videoByCreator.get(creator.id);
      const status =
        linkedVideo
          ? "posted"
          : (statusByCreator[creator.id] ??
            creator.workflow_status ??
            "brief_sent");
      counts[status] += 1;
    }

    return counts;
  }, [campaign.creators, statusByCreator, videoByCreator]);

  function handleStatusChange(
    creatorId: string,
    status: CampaignCreatorWorkflowStatus,
  ) {
    if (videoByCreator.has(creatorId)) {
      showError("Status is locked to Uploaded while a video is linked.");
      return;
    }

    const previous =
      statusByCreator[creatorId] ??
      campaign.creators.find((creator) => creator.id === creatorId)
        ?.workflow_status ??
      "brief_sent";
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
    <section className={embedded ? "" : "mb-8"}>
      {!embedded ? (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track each creator from brief through upload. Paste video links below
            when they go live.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Creator progress
          </h4>
        </div>
      )}

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
              : "Add to tracker"}
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
            title="No creators in tracker yet"
            description="Add creators above, then paste their video links in the section below."
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
              <DataTableHeaderCell>Live video</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {campaign.creators.map((creator) => {
                const linkedVideo = videoByCreator.get(creator.id);
                const workflowStatus = linkedVideo
                  ? "posted"
                  : (statusByCreator[creator.id] ??
                    creator.workflow_status ??
                    "brief_sent");

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
                          Boolean(linkedVideo) ||
                          (isSavingStatus && savingStatusId === creator.id)
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            creator.id,
                            event.target.value as CampaignCreatorWorkflowStatus,
                          )
                        }
                        aria-label={`Status for ${creator.name}`}
                        className={cn(
                          "w-full min-w-[10rem] rounded-lg border px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-kefoo-500/20 disabled:cursor-not-allowed disabled:opacity-60",
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
                      {linkedVideo ? (
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
                          Paste link below
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
