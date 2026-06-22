"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteContentPlannerItem } from "@/app/actions/content-planner";
import { ContentPlannerCalendar } from "@/components/planner/content-planner-calendar";
import { ContentPlannerDetailDrawer } from "@/components/planner/content-planner-detail-drawer";
import { ContentPlannerFormModal } from "@/components/planner/content-planner-form-modal";
import { ContentPlannerSummaryCards } from "@/components/planner/content-planner-summary-cards";
import { ContentPlannerTable } from "@/components/planner/content-planner-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { ContentPlannerView } from "@/lib/content-planner";
import type {
  CampaignOption,
  ContentPlannerAgency,
  Creator,
} from "@/types/database";

type ContentPlannerSectionProps = {
  view: ContentPlannerView;
  items: ContentPlannerAgency[];
  campaigns: CampaignOption[];
  creators: Creator[];
};

export function ContentPlannerSection({
  view,
  items,
  campaigns,
  creators,
}: ContentPlannerSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlannerAgency | null>(
    null,
  );
  const [defaultPlannedDate, setDefaultPlannedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<ContentPlannerAgency | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentPlannerAgency | null>(
    null,
  );
  const [isDeleting, startDeleteTransition] = useTransition();

  function openCreate(plannedDate = "") {
    setEditingItem(null);
    setDefaultPlannedDate(plannedDate);
    setFormOpen(true);
  }

  function openEdit(item: ContentPlannerAgency) {
    setEditingItem(item);
    setDefaultPlannedDate("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
    setDefaultPlannedDate("");
  }

  function openDetails(item: ContentPlannerAgency) {
    setSelectedItem(item);
    setDrawerOpen(true);
  }

  function closeDetails() {
    setDrawerOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteContentPlannerItem(deleteTarget.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      if (selectedItem?.id === deleteTarget.id) {
        setDrawerOpen(false);
        setSelectedItem(null);
      }

      showSuccess("Content deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Content
        </button>
      </div>

      {view === "list" ? (
        <ContentPlannerTable
          rows={items}
          campaigns={campaigns}
          onEdit={openEdit}
          onViewDetails={openDetails}
          onDelete={setDeleteTarget}
        />
      ) : (
        <>
          <ContentPlannerSummaryCards items={items} />
          <ContentPlannerCalendar
            items={items}
            onViewDetails={openDetails}
            onAddContent={openCreate}
          />
        </>
      )}

      <ContentPlannerFormModal
        open={formOpen}
        onClose={closeForm}
        item={editingItem}
        defaultPlannedDate={defaultPlannedDate}
        campaigns={campaigns}
        creators={creators}
      />

      <ContentPlannerDetailDrawer
        item={selectedItem}
        open={drawerOpen}
        onClose={closeDetails}
        campaigns={campaigns}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this content idea?"
        description="This action cannot be undone."
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
