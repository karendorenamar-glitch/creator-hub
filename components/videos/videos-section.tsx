"use client";

import { useState, useTransition } from "react";
import { Plus, Upload } from "lucide-react";
import {
  deleteVideo,
  refreshAllVideoMetrics,
  refreshVideoMetrics,
} from "@/app/actions/videos";
import { VideoBulkUploadModal } from "@/components/videos/video-bulk-upload-modal";
import { VideoFormModal } from "@/components/videos/video-form-modal";
import { VideosTable } from "@/components/videos/videos-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { CampaignOption, Creator, VideoWithCreator } from "@/types/database";

type VideosSectionProps = {
  videos: VideoWithCreator[];
  creators: Pick<Creator, "id" | "name" | "platform">[];
  campaigns: CampaignOption[];
};

export function VideosSection({ videos, creators, campaigns }: VideosSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoWithCreator | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<VideoWithCreator | null>(
    null,
  );
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function openCreate() {
    setEditingVideo(null);
    setFormOpen(true);
  }

  function openEdit(video: VideoWithCreator) {
    setEditingVideo(video);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingVideo(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteVideo(deleteTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(`"${deleteTarget.video_url}" was deleted.`);
      setDeleteTarget(null);
    });
  }

  async function handleRefresh(video: VideoWithCreator) {
    setRefreshingId(video.id);

    try {
      const result = await refreshVideoMetrics(video.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Video metrics refreshed.");
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleRefreshAll() {
    if (videos.length === 0) return;

    setIsRefreshingAll(true);

    try {
      const result = await refreshAllVideoMetrics();

      if (result.error) {
        showError(result.error);
        return;
      }

      const { refreshed = 0, failed = 0, total = 0 } = result.data ?? {};

      if (refreshed === 0 && failed > 0) {
        showError("Failed to refresh video metrics.");
        return;
      }

      if (failed > 0) {
        showSuccess(
          `Refreshed ${refreshed} of ${total} videos. ${failed} failed.`,
        );
        return;
      }

      showSuccess(
        total === 1
          ? "Video metrics refreshed."
          : `All ${refreshed} videos refreshed.`,
      );
    } finally {
      setIsRefreshingAll(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={videos.length === 0 || isRefreshingAll || refreshingId !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={isRefreshingAll ? "inline-block animate-spin" : undefined}>
            🔄
          </span>
          {isRefreshingAll ? "Refreshing..." : "Refresh All Videos"}
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            disabled={campaigns.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={creators.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add Video
          </button>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Create a campaign first to use Bulk Upload. Bulk upload links videos
          and creators to the campaign you select.
        </div>
      )}

      {creators.length === 0 && campaigns.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add a creator manually to use Add Video, or use Bulk Upload to create
          creators automatically from TikTok @usernames.
        </div>
      )}

      <VideosTable
        videos={videos}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onRefresh={handleRefresh}
        refreshingId={refreshingId}
        isRefreshingAll={isRefreshingAll}
      />

      <VideoBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        campaigns={campaigns}
      />

      <VideoFormModal
        open={formOpen}
        onClose={closeForm}
        creators={creators}
        video={editingVideo}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete video?"
        description={`This will permanently remove "${deleteTarget?.video_url ?? "this video"}". This action cannot be undone.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
