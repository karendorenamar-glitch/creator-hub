"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignsTable } from "@/components/campaigns/campaigns-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type {
  CampaignListItem,
  Creator,
  VideoWithCreator,
} from "@/types/database";

type CampaignsSectionProps = {
  campaigns: CampaignListItem[];
  creators: Creator[];
  videos: VideoWithCreator[];
};

export function CampaignsSection({
  campaigns,
  creators,
  videos,
}: CampaignsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<CampaignListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignListItem | null>(
    null,
  );
  const [isDeleting, startDeleteTransition] = useTransition();

  function openCreate() {
    setEditingCampaign(null);
    setFormOpen(true);
  }

  function openEdit(campaign: CampaignListItem) {
    setEditingCampaign(campaign);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCampaign(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteCampaign(deleteTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(`"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add Campaign
        </button>
      </div>

      <CampaignsTable
        campaigns={campaigns}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <CampaignFormModal
        open={formOpen}
        onClose={closeForm}
        campaign={editingCampaign}
        creators={creators}
        videos={videos}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete campaign?"
        description={`This will permanently remove "${deleteTarget?.name ?? "this campaign"}" and unlink all associated creators and videos.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
