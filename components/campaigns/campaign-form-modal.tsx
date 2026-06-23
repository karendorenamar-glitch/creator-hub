"use client";

import { useEffect, useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";

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
  status: "draft",
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

  useEffect(() => {
    if (!open) return;

    setError(null);

    if (!campaign) {
      setForm(emptyForm);
      return;
    }

    setLoadingRelations(true);
    getCampaignRelationIds(campaign.id)
      .then(({ creator_ids, video_ids }) => {
        setForm({
          name: campaign.name,
          client_name: campaign.client_name,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: Number(campaign.budget),
          status: campaign.status,
          creator_ids,
          video_ids,
        });
      })
      .finally(() => setLoadingRelations(false));
  }, [open, campaign]);

  function handleChange<K extends keyof CampaignInput>(
    field: K,
    value: CampaignInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleId(field: "creator_ids" | "video_ids", id: string) {
    setForm((current) => {
      const ids = current[field];
      return {
        ...current,
        [field]: ids.includes(id)
          ? ids.filter((value) => value !== id)
          : [...ids, id],
      };
    });
  }

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
              creators.map((creator) => (
                <label
                  key={creator.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={form.creator_ids.includes(creator.id)}
                    onChange={() => toggleId("creator_ids", creator.id)}
                    className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">
                    {creator.name} · {creator.platform}
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>

        <FormField label="Videos" htmlFor="campaign-videos">
          <div
            id="campaign-videos"
            className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3"
          >
            {videos.length === 0 ? (
              <p className="text-sm text-slate-500">No videos available.</p>
            ) : (
              videos.map((video) => (
                <label
                  key={video.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.video_ids.includes(video.id)}
                    onChange={() => toggleId("video_ids", video.id)}
                    className="mt-0.5 rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="block truncate">{video.video_url}</span>
                    <span className="text-xs text-slate-500">
                      {video.creators?.name ?? "Unknown"} ·{" "}
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
