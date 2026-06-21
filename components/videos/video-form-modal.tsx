"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createVideo,
  importVideoMetrics,
  updateVideo,
  type VideoInput,
} from "@/app/actions/videos";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { Creator, VideoWithCreator } from "@/types/database";

type VideoFormModalProps = {
  open: boolean;
  onClose: () => void;
  creators: Pick<Creator, "id" | "name" | "platform">[];
  video?: VideoWithCreator | null;
};

const emptyForm: VideoInput = {
  creator_id: "",
  video_url: "",
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
};

export function VideoFormModal({
  open,
  onClose,
  creators,
  video,
}: VideoFormModalProps) {
  const isEditing = Boolean(video);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<VideoInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setError(null);
    setForm(
      video
        ? {
            creator_id: video.creator_id,
            video_url: video.video_url,
            views: video.views,
            likes: video.likes,
            comments: video.comments,
            shares: video.shares,
            saves: video.saves,
          }
        : {
            ...emptyForm,
            creator_id: creators[0]?.id ?? "",
          },
    );
  }, [open, video, creators]);

  function handleChange(field: keyof VideoInput, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImportMetrics() {
    const trimmedUrl = form.video_url.trim();

    if (!trimmedUrl) {
      setError("Enter a TikTok URL before importing metrics.");
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const result = await importVideoMetrics(trimmedUrl);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      if (result.data) {
        setForm((current) => ({
          ...current,
          views: result.data.views,
          likes: result.data.likes,
          comments: result.data.comments,
          shares: result.data.shares,
          saves: result.data.saves,
        }));
        showSuccess("Metrics imported from TikTok.");
      }
    } finally {
      setIsImporting(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.creator_id) {
      setError("Please select a creator.");
      return;
    }

    if (!form.video_url.trim()) {
      setError("TikTok URL is required.");
      return;
    }

    startTransition(async () => {
      const result = video
        ? await updateVideo(video.id, form)
        : await createVideo(form);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess(
        isEditing ? "Video updated successfully." : "Video added successfully.",
      );
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Video" : "Add Video"}
      description={
        isEditing
          ? "Update video metrics and save changes."
          : "Add a new video to track performance."
      }
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Creator" htmlFor="video-creator">
          <select
            id="video-creator"
            value={form.creator_id}
            onChange={(event) => handleChange("creator_id", event.target.value)}
            className={inputClassName}
            required
            disabled={creators.length === 0}
          >
            {creators.length === 0 ? (
              <option value="">No creators available</option>
            ) : (
              creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name} · {creator.platform}
                </option>
              ))
            )}
          </select>
        </FormField>

        <FormField label="TikTok URL" htmlFor="video-url">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="video-url"
              type="url"
              value={form.video_url}
              onChange={(event) =>
                handleChange("video_url", event.target.value)
              }
              className={inputClassName}
              placeholder="https://www.tiktok.com/@..."
              required
            />
            <button
              type="button"
              onClick={handleImportMetrics}
              disabled={isPending || isImporting || !form.video_url.trim()}
              className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              {isImporting ? "Importing..." : "Import Metrics"}
            </button>
          </div>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Views" htmlFor="video-views">
            <input
              id="video-views"
              type="number"
              min="0"
              value={form.views}
              onChange={(event) =>
                handleChange("views", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Likes" htmlFor="video-likes">
            <input
              id="video-likes"
              type="number"
              min="0"
              value={form.likes}
              onChange={(event) =>
                handleChange("likes", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Comments" htmlFor="video-comments">
            <input
              id="video-comments"
              type="number"
              min="0"
              value={form.comments}
              onChange={(event) =>
                handleChange("comments", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Shares" htmlFor="video-shares">
            <input
              id="video-shares"
              type="number"
              min="0"
              value={form.shares}
              onChange={(event) =>
                handleChange("shares", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>

          <FormField label="Saves" htmlFor="video-saves">
            <input
              id="video-saves"
              type="number"
              min="0"
              value={form.saves}
              onChange={(event) =>
                handleChange("saves", Number(event.target.value) || 0)
              }
              className={inputClassName}
            />
          </FormField>
        </div>

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
            disabled={isPending || creators.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Save Video"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
