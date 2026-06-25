"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignRowActionsProps = {
  campaignId: string;
  campaignName: string;
  onEdit?: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
};

export function CampaignRowActions({
  campaignId,
  campaignName,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  className,
}: CampaignRowActionsProps) {
  return (
    <div className={cn("flex flex-wrap justify-end gap-2", className)}>
      <Link
        href={`/campaigns/${campaignId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-kefoo-200 bg-kefoo-50 px-3 py-2 text-sm font-medium text-kefoo-700 transition-colors hover:bg-kefoo-100"
        aria-label={`View ${campaignName}`}
      >
        <Eye className="h-4 w-4" />
        View
      </Link>
      {canEdit && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          aria-label={`Edit ${campaignName}`}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          aria-label={`Delete ${campaignName}`}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      ) : null}
    </div>
  );
}
