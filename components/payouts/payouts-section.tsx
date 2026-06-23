"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deletePayout } from "@/app/actions/payouts";
import { PayoutEditModal } from "@/components/payouts/payout-edit-modal";
import { PayoutFormModal } from "@/components/payouts/payout-form-modal";
import { PayoutStatusChart } from "@/components/payouts/payout-status-chart";
import { PayoutsTable } from "@/components/payouts/payouts-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type {
  CampaignOption,
  Creator,
  PayoutWithTiming,
} from "@/types/database";

type PayoutsSectionProps = {
  payouts: PayoutWithTiming[];
  creators: Creator[];
  campaigns: CampaignOption[];
};

export function PayoutsSection({
  payouts,
  creators,
  campaigns,
}: PayoutsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PayoutWithTiming | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayoutWithTiming | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deletePayout(deleteTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Payout deleted.");
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <PayoutStatusChart payouts={payouts} />

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kefoo-300"
        >
          <Plus className="h-4 w-4" />
          Create Payout
        </button>
      </div>

      <PayoutsTable
        payouts={payouts}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      <PayoutFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        creators={creators}
        campaigns={campaigns}
      />

      <PayoutEditModal
        open={Boolean(editTarget)}
        payout={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete payout?"
        description={`This will permanently remove the payout for ${deleteTarget?.creators?.name ?? "this creator"}.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
