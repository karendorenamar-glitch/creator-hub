"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createVideoFromUrl,
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
import {
  IMPORT_DURATION_LABEL,
  ImportWaitNotice,
} from "@/components/ui/import-wait-notice";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  validateVideoUrlForPlatform,
  VIDEO_PLATFORMS,
  type VideoPlatform,
} from "@/lib/video-url";
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

const PLATFORM_PLACEHOLDERS: Record<VideoPlatform, string> = {
  TikTok: "https://www.tiktok.com/@creator/video/1234567890",
  Instagram:
    "https://www.instagram.com/reel/ABC123/ or https://www.instagram.com/p/XYZ789/",
};

const PLATFORM_URL_LABELS: Record<VideoPlatform, string> = {
  TikTok: "TikTok URL",
  Instagram: "Reels URL",
};

function getAddVideoDescription(
  platform: VideoPlatform,
  t: (key: import("@/lib/i18n/messages").MessageKey) => string,
) {
  return platform === "Instagram"
    ? t("pages.videos.addInstagramDescription")
    : t("pages.videos.addVideoDescription");
}

export function VideoFormModal({
  open,
  onClose,
  creators,
  video,
}: VideoFormModalProps) {
  const isEditing = Boolean(video);
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState<VideoInput>(emptyForm);
  const [platform, setPlatform] = useState<VideoPlatform>("TikTok");
  const [error, setError] = useState<string | null>(null);
  const [metricsImported, setMetricsImported] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setError(null);
    setMetricsImported(false);
    setPlatform("TikTok");
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
            creator_id: "",
          },
    );
  }, [open, video, creators]);

  function handleChange(field: keyof VideoInput, value: string | number) {
    if (field === "video_url") {
      setMetricsImported(false);
    }
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImportMetrics() {
    const trimmedUrl = form.video_url.trim();
    const platformError = validateVideoUrlForPlatform(trimmedUrl, platform);

    if (platformError) {
      setError(platformError);
      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const result = await importVideoMetrics(trimmedUrl, platform);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      if (result.data) {
        setMetricsImported(true);
        setForm((current) => ({
          ...current,
          views: result.data.views,
          likes: result.data.likes,
          comments: result.data.comments,
          shares: result.data.shares,
          saves: result.data.saves,
        }));
        showSuccess(
          platform === "Instagram"
            ? "Metrics imported from Instagram."
            : "Metrics imported from TikTok.",
        );
      }
    } finally {
      setIsImporting(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isEditing) {
      const platformError = validateVideoUrlForPlatform(
        form.video_url.trim(),
        platform,
      );

      if (platformError) {
        setError(platformError);
        return;
      }
    } else if (!form.video_url.trim()) {
      setError("Video URL is required.");
      return;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateVideo(video!.id, form)
        : await createVideoFromUrl({
            video_url: form.video_url,
            platform,
            import_metrics: !metricsImported,
            auto_create_creator: true,
            ...(metricsImported
              ? {
                  metrics: {
                    views: form.views,
                    likes: form.likes,
                    comments: form.comments,
                    shares: form.shares,
                    saves: form.saves,
                  },
                }
              : {}),
          });

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
      title={isEditing ? t("pages.videos.editVideo") : t("pages.videos.addVideo")}
      description={
        isEditing
          ? t("pages.videos.editVideoDescription")
          : getAddVideoDescription(platform, t)
      }
      loading={isPending || isImporting}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (platform === "TikTok" || platform === "Instagram") ? (
          <ImportWaitNotice />
        ) : null}

        {!isEditing && platform === "Instagram" ? (
          <div
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-medium">
              Meta metrics are not imported automatically.
            </p>
            <p className="mt-1 text-amber-900">
              Views, shares, and saves are not available from Instagram via Meta.
              Enter them manually in Performance → Creators after import.
            </p>
          </div>
        ) : null}

        {isEditing ? (
          <FormField label="Creator" htmlFor="video-creator">
            <select
              id="video-creator"
              value={form.creator_id}
              onChange={(event) =>
                handleChange("creator_id", event.target.value)
              }
              className={inputClassName}
              disabled
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
        ) : (
          <FormField label="Platform" htmlFor="video-platform">
            <select
              id="video-platform"
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as VideoPlatform)
              }
              className={inputClassName}
              disabled={isPending || isImporting}
            >
              {VIDEO_PLATFORMS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField
          label={isEditing ? "Video URL" : PLATFORM_URL_LABELS[platform]}
          htmlFor="video-url"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="video-url"
              type="url"
              value={form.video_url}
              onChange={(event) =>
                handleChange("video_url", event.target.value)
              }
              className={inputClassName}
              placeholder={PLATFORM_PLACEHOLDERS[platform]}
              required
            />
            <button
              type="button"
              onClick={handleImportMetrics}
              disabled={isPending || isImporting || !form.video_url.trim()}
              className="shrink-0 rounded-lg border border-kefoo-200 bg-kefoo-50 px-4 py-2.5 text-sm font-medium text-kefoo-700 hover:bg-kefoo-100 disabled:opacity-60"
            >
              {isImporting
                ? "Importing..."
                : `Import Metrics (${IMPORT_DURATION_LABEL})`}
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
            disabled={isPending}
            className="rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:opacity-60"
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
