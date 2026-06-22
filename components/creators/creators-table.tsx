"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { formatCreatorUsername, formatIDR, formatNumber } from "@/lib/utils";
import type { Creator } from "@/types/database";
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
  creators: Creator[];
  onEdit: (creator: Creator) => void;
  onDelete: (creator: Creator) => void;
};

function CreatorAvatar({ creator }: { creator: Creator }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
      {creator.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function CreatorsTable({ creators, onEdit, onDelete }: CreatorsTableProps) {
  if (creators.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="No creators found"
          description="Try a different search or add your first creator."
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Name</DataTableHeaderCell>
          <DataTableHeaderCell>Profile</DataTableHeaderCell>
          <DataTableHeaderCell>Contact</DataTableHeaderCell>
          <DataTableHeaderCell>Platform</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">
            Followers
          </DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Fee</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {creators.map((creator) => (
            <DataTableRow key={creator.id}>
              <DataTableCell>
                <div className="flex items-center gap-3">
                  <CreatorAvatar creator={creator} />
                  <Link
                    href={`/creators/${creator.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {creator.name}
                  </Link>
                </div>
              </DataTableCell>
              <DataTableCell className="text-slate-600">
                {formatCreatorUsername(creator.tiktok_username)}
              </DataTableCell>
              <DataTableCell className="max-w-xs truncate text-slate-500">
                {creator.contact ?? "—"}
              </DataTableCell>
              <DataTableCell>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {creator.platform}
                </span>
              </DataTableCell>
              <DataTableCell className="text-right font-medium text-slate-900">
                {formatNumber(creator.followers)}
              </DataTableCell>
              <DataTableCell className="text-right font-medium text-slate-900">
                {formatIDR(creator.fee)}
              </DataTableCell>
              <DataTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(creator)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
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
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
