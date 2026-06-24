"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignSummaryCards } from "@/components/campaigns/campaign-summary-cards";
import { FreeTrialUsageBanner } from "@/components/plan/plan-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type {
  CampaignSummary,
  Creator,
  OrgMemberRole,
  VideoWithCreator,
} from "@/types/database";

type CampaignsSectionProps = {
  campaigns: CampaignSummary[];
  creators: Creator[];
  videos: VideoWithCreator[];
  currentUserId: string;
  memberRole: OrgMemberRole;
};

export function CampaignsSection({
  campaigns,
  creators,
  videos,
  currentUserId,
  memberRole,
}: CampaignsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignSummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CampaignSummary | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function openCreate() {
    setEditingCampaign(null);
    setFormOpen(true);
  }

  function openEdit(campaign: CampaignSummary) {
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
      <FreeTrialUsageBanner />

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kefoo-300"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>

      <CampaignSummaryCards
        campaigns={campaigns}
        currentUserId={currentUserId}
        memberRole={memberRole}
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
        description={`This will permanently remove "${deleteTarget?.name ?? "this campaign"}". Linked content planner items will be kept but unassigned from this campaign.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
