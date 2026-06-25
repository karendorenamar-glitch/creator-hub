"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaign,
  getCampaignRelationIds,
  updateCampaign,
  type CampaignInput,
} from "@/app/actions/campaigns";
import { CAMPAIGN_STATUSES } from "@/components/campaigns/campaign-status-badge";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { Campaign, CampaignStatus, Creator, VideoWithCreator } from "@/types/database";
import { cn, formatUploadedAgo } from "@/lib/utils";

type CampaignFormModalProps = {
  open: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  creators: Creator[];
  videos: VideoWithCreator[];
};

const emptyForm: CampaignInput = {
  name: "",
  client_name: "",
  start_date: "",
  end_date: "",
  budget: 0,
  status: "active",
  creator_ids: [],
  video_ids: [],
};

export function CampaignFormModal({
  open,
  onClose,
  campaign,
  creators,
  videos,
}: CampaignFormModalProps) {
  const isEditing = Boolean(campaign);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<CampaignInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [focusedCreatorId, setFocusedCreatorId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setFocusedCreatorId(null);

    if (!campaign) {
      setForm(emptyForm);
      return;
    }

    setLoadingRelations(true);
    getCampaignRelationIds(campaign.id)
      .then(({ creator_ids, video_ids }) => {
        const creatorIdSet = new Set(creator_ids);

        for (const videoId of video_ids) {
          const video = videos.find((item) => item.id === videoId);
          if (video?.creator_id) {
            creatorIdSet.add(video.creator_id);
          }
        }

        setForm({
          name: campaign.name,
          client_name: campaign.client_name,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: Number(campaign.budget),
          status: campaign.status,
          creator_ids: [...creatorIdSet],
          video_ids,
        });
      })
      .finally(() => setLoadingRelations(false));
  }, [open, campaign, videos]);

  function handleChange<K extends keyof CampaignInput>(
    field: K,
    value: CampaignInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCreatorId(creatorId: string) {
    const isSelected = form.creator_ids.includes(creatorId);

    if (isSelected) {
      const creatorVideoIds = new Set(
        videos
          .filter((video) => video.creator_id === creatorId)
          .map((video) => video.id),
      );

      if (focusedCreatorId === creatorId) {
        setFocusedCreatorId(null);
      }

      setForm((current) => ({
        ...current,
        creator_ids: current.creator_ids.filter((id) => id !== creatorId),
        video_ids: current.video_ids.filter((id) => !creatorVideoIds.has(id)),
      }));
      return;
    }

    setFocusedCreatorId(creatorId);
    setForm((current) => ({
      ...current,
      creator_ids: [...current.creator_ids, creatorId],
    }));
  }

  function focusCreator(creatorId: string) {
    if (!form.creator_ids.includes(creatorId)) {
      toggleCreatorId(creatorId);
      return;
    }

    setFocusedCreatorId((current) =>
      current === creatorId ? null : creatorId,
    );
  }

  function toggleVideoId(videoId: string) {
    setForm((current) => ({
      ...current,
      video_ids: current.video_ids.includes(videoId)
        ? current.video_ids.filter((id) => id !== videoId)
        : [...current.video_ids, videoId],
    }));
  }

  const visibleVideos = useMemo(() => {
    const selectedCreatorIds = new Set(form.creator_ids);

    return videos
      .filter((video) => {
        if (!selectedCreatorIds.has(video.creator_id)) {
          return false;
        }

        if (focusedCreatorId) {
          return video.creator_id === focusedCreatorId;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [videos, form.creator_ids, focusedCreatorId]);

  const focusedCreatorName = focusedCreatorId
    ? creators.find((creator) => creator.id === focusedCreatorId)?.name
    : null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Campaign name is required.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError("Start and end dates are required.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date must be on or after the start date.");
      return;
    }

    startTransition(async () => {
      const result = campaign
        ? await updateCampaign(campaign.id, form)
        : await createCampaign(form);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess(
        isEditing
          ? "Campaign updated successfully."
          : "Campaign created successfully.",
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Campaign" : "Add Campaign"}
      description={
        isEditing
          ? "Update campaign details and linked creators or videos."
          : "Create a new campaign and assign creators and videos."
      }
      loading={isPending || loadingRelations}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Campaign Name" htmlFor="campaign-name">
          <input
            id="campaign-name"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={inputClassName}
            placeholder="Summer Launch 2026"
            required
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start Date" htmlFor="campaign-start">
            <input
              id="campaign-start"
              type="date"
              value={form.start_date}
              onChange={(event) =>
                handleChange("start_date", event.target.value)
              }
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label="End Date" htmlFor="campaign-end">
            <input
              id="campaign-end"
              type="date"
              value={form.end_date}
              onChange={(event) => handleChange("end_date", event.target.value)}
              className={inputClassName}
              required
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Budget" htmlFor="campaign-budget">
            <input
              id="campaign-budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={(event) =>
                handleChange("budget", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Status" htmlFor="campaign-status">
            <select
              id="campaign-status"
              value={form.status}
              onChange={(event) =>
                handleChange("status", event.target.value as CampaignStatus)
              }
              className={inputClassName}
            >
              {CAMPAIGN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Creators" htmlFor="campaign-creators">
          <div
            id="campaign-creators"
            className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3"
          >
            {creators.length === 0 ? (
              <p className="text-sm text-slate-500">No creators available.</p>
            ) : (
              creators.map((creator) => {
                const isChecked = form.creator_ids.includes(creator.id);
                const isFocused = focusedCreatorId === creator.id;

                return (
                <div
                  key={creator.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => focusCreator(creator.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      focusCreator(creator.id);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50",
                    isFocused && "bg-kefoo-50 ring-1 ring-inset ring-kefoo-200",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCreatorId(creator.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">
                    {creator.name} · {creator.platform}
                  </span>
                </div>
                );
              })
            )}
          </div>
        </FormField>

        <FormField label="Videos" htmlFor="campaign-videos">
          <p className="mb-2 text-xs leading-relaxed text-slate-500">
            {form.creator_ids.length === 0
              ? "Check a creator to see their videos."
              : focusedCreatorName
                ? `Showing videos for ${focusedCreatorName} only.`
                : `Showing videos from ${form.creator_ids.length} selected creator${form.creator_ids.length === 1 ? "" : "s"}. Click a creator to narrow the list.`}
          </p>
          <div
            id="campaign-videos"
            className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3"
          >
            {form.creator_ids.length === 0 ? (
              <p className="text-sm text-slate-500">
                Select creators above to see their videos.
              </p>
            ) : visibleVideos.length === 0 ? (
              <p className="text-sm text-slate-500">
                No videos available for the selected creators.
              </p>
            ) : (
              visibleVideos.map((video) => (
                <label
                  key={video.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.video_ids.includes(video.id)}
                    onChange={() => toggleVideoId(video.id)}
                    className="mt-0.5 rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="block truncate">{video.video_url}</span>
                    <span className="text-xs text-slate-500">
                      {formatUploadedAgo(video.created_at)} ·{" "}
                      {video.views.toLocaleString()} views
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>

        {error && <FormError message={error} />}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || loadingRelations}
            className="rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Save Campaign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
