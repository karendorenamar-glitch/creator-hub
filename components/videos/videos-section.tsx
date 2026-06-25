"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Plus, Upload } from "lucide-react";
import { deleteVideo } from "@/app/actions/videos";
import { VideoBulkUploadModal } from "@/components/videos/video-bulk-upload-modal";
import { VideoFormModal } from "@/components/videos/video-form-modal";
import { VideosTable } from "@/components/videos/videos-table";
import { FreeTrialUsageBanner, usePlan, useRequirePlanFeature } from "@/components/plan/plan-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type {
  CampaignOption,
  Creator,
  OrgMemberRole,
  VideoWithCreator,
} from "@/types/database";

type VideosSectionProps = {
  videos: VideoWithCreator[];
  creators: Pick<Creator, "id" | "name" | "platform">[];
  campaigns: CampaignOption[];
  currentUserId: string;
  memberRole: OrgMemberRole;
};

export function VideosSection({
  videos,
  creators,
  campaigns,
  currentUserId,
  memberRole,
}: VideosSectionProps) {
  const { hasFeature } = usePlan();
  const requireBulkUpload = useRequirePlanFeature("bulk_upload");
  const canUseBulkUpload = hasFeature("bulk_upload");
  const { showSuccess, showError } = useToast();
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoWithCreator | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<VideoWithCreator | null>(
    null,
  );
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

  return (
    <>
      <FreeTrialUsageBanner />

      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => requireBulkUpload(() => setBulkOpen(true))}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Upload className="h-4 w-4" />
          {t("pages.videos.bulkUpload")}
        </button>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kefoo-300"
        >
          <Plus className="h-4 w-4" />
          {t("pages.videos.addVideo")}
        </button>
      </div>

      <div className="mb-6 flex gap-2.5 rounded-xl border border-kefoo-200 bg-kefoo-50 px-4 py-3 text-sm leading-relaxed text-kefoo-950">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-kefoo-400" aria-hidden />
        <p>
          <span className="font-semibold">{t("pages.videos.hacksLabel")}:</span>{" "}
          {t("pages.videos.hacks")}
        </p>
      </div>

      {campaigns.length === 0 && canUseBulkUpload && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("pages.videos.bulkUploadWarning")}
        </div>
      )}

      <VideosTable
        videos={videos}
        currentUserId={currentUserId}
        memberRole={memberRole}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      {canUseBulkUpload ? (
        <VideoBulkUploadModal
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          campaigns={campaigns}
        />
      ) : null}

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
