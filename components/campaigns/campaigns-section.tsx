"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignSummaryCards } from "@/components/campaigns/campaign-summary-cards";
import { WorkspaceTutorial } from "@/components/onboarding/workspace-tutorial";
import { FreeTrialUsageBanner } from "@/components/plan/plan-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { WorkspaceTutorialUsage } from "@/lib/workspace-tutorial";
import type { CampaignSummary, OrgMemberRole } from "@/types/database";

type CampaignsSectionProps = {
  campaigns: CampaignSummary[];
  currentUserId: string;
  memberRole: OrgMemberRole;
  orgId: string;
  usage: WorkspaceTutorialUsage;
};

export function CampaignsSection({
  campaigns,
  currentUserId,
  memberRole,
  orgId,
  usage,
}: CampaignsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampaignSummary | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

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

  const firstCampaignId = campaigns[0]?.id ?? null;

  return (
    <>
      <FreeTrialUsageBanner />

      <WorkspaceTutorial
        orgId={orgId}
        usage={usage}
        firstCampaignId={firstCampaignId}
        onCreateCampaign={() => setFormOpen(true)}
      />

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
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
        onDelete={setDeleteTarget}
      />

      <CampaignFormModal open={formOpen} onClose={() => setFormOpen(false)} />

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
