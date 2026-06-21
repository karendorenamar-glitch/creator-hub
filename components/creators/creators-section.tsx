"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { deleteCreator } from "@/app/actions/creators";
import { CreatorFormModal } from "@/components/creators/creator-form-modal";
import { CreatorsTable } from "@/components/creators/creators-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Creator } from "@/types/database";

type CreatorsSectionProps = {
  creators: Creator[];
};

export function CreatorsSection({ creators }: CreatorsSectionProps) {
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Creator | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function openCreate() {
    setEditingCreator(null);
    setFormOpen(true);
  }

  function openEdit(creator: Creator) {
    setEditingCreator(creator);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCreator(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteCreator(deleteTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(`${deleteTarget.name} was deleted.`);
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
          Add Creator
        </button>
      </div>

      <CreatorsTable
        creators={creators}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <CreatorFormModal
        open={formOpen}
        onClose={closeForm}
        creator={editingCreator}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete creator?"
        description={`This will permanently remove ${deleteTarget?.name ?? "this creator"}. If deletion is blocked, linked videos or campaign memberships must be removed first.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}