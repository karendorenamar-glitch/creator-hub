"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  formatCreatorDisplayName,
  formatCreatorListUsername,
  formatLastUpdatedAgo,
  formatOptionalIDR,
  formatOptionalNumber,
} from "@/lib/utils";
import { canModifyOwnedResource } from "@/lib/org-team";
import type { CreatorListItem, OrgMemberRole } from "@/types/database";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
} from "@/components/ui/data-table";

type CreatorsTableProps = {
  creators: CreatorListItem[];
  currentUserId: string;
  memberRole: OrgMemberRole;
  onEdit: (creator: CreatorListItem) => void;
  onDelete: (creator: CreatorListItem) => void;
};

function formatCampaigns(creator: CreatorListItem): string {
  if (creator.campaigns.length === 0) return "—";
  return creator.campaigns.map((campaign) => campaign.name).join(", ");
}

export function CreatorsTable({
  creators,
  currentUserId,
  memberRole,
  onEdit,
  onDelete,
}: CreatorsTableProps) {
  if (creators.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="No creators match"
          description="Try a different search, or paste a video link to add someone automatically."
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Username</DataTableHeaderCell>
          <DataTableHeaderCell>Name</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">
            Followers
          </DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Fee</DataTableHeaderCell>
          <DataTableHeaderCell>Contact</DataTableHeaderCell>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {creators.map((creator) => {
            const canModify = canModifyOwnedResource({
              role: memberRole,
              userId: currentUserId,
              createdBy: creator.created_by,
            });

            return (
            <DataTableRow key={creator.id}>
              <DataTableCell className="font-medium text-slate-900">
                <Link
                  href={`/creators/${creator.id}`}
                  className="text-kefoo-600 hover:text-kefoo-500"
                >
                  {formatCreatorListUsername(creator)}
                </Link>
                <p className="mt-0.5 text-xs font-normal text-slate-500">
                  {formatLastUpdatedAgo(creator.created_at)}
                </p>
              </DataTableCell>
              <DataTableCell className="text-slate-700">
                <Link
                  href={`/creators/${creator.id}`}
                  className="hover:text-kefoo-600"
                >
                  {formatCreatorDisplayName(creator.name)}
                </Link>
              </DataTableCell>
              <DataTableCell className="text-right text-slate-700">
                {formatOptionalNumber(creator.followers)}
              </DataTableCell>
              <DataTableCell className="text-right text-slate-700">
                {formatOptionalIDR(creator.fee)}
              </DataTableCell>
              <DataTableCell className="max-w-xs truncate text-slate-500">
                {creator.contact ?? "—"}
              </DataTableCell>
              <DataTableCell className="max-w-xs truncate text-slate-600">
                {formatCampaigns(creator)}
              </DataTableCell>
              <DataTableCell className="text-right">
                {canModify ? (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(creator)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-kefoo-50 hover:text-kefoo-600"
                    aria-label={`Edit ${creator.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(creator)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${creator.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </DataTableCell>
            </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
