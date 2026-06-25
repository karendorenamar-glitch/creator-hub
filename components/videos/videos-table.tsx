"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatLastUpdatedAgo, formatNumber } from "@/lib/utils";
import { canModifyOwnedResource } from "@/lib/org-team";
import type { OrgMemberRole, VideoWithCreator } from "@/types/database";
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

type VideosTableProps = {
  videos: VideoWithCreator[];
  currentUserId: string;
  memberRole: OrgMemberRole;
  onEdit: (video: VideoWithCreator) => void;
  onDelete: (video: VideoWithCreator) => void;
};

export function VideosTable({
  videos,
  currentUserId,
  memberRole,
  onEdit,
  onDelete,
}: VideosTableProps) {
  if (videos.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="Your video library is empty"
          description="Paste a TikTok or Instagram link to import metrics and start tracking."
          hint="paste link → import metrics → done"
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Video URL</DataTableHeaderCell>
          <DataTableHeaderCell>Creator</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Likes</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">
            Comments
          </DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Shares</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Saves</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {videos.map((video) => {
            const canModify = canModifyOwnedResource({
              role: memberRole,
              userId: currentUserId,
              createdBy: video.created_by,
            });

            return (
              <DataTableRow key={video.id}>
                <DataTableCell className="max-w-xs">
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium text-kefoo-600 hover:text-kefoo-500"
                  >
                    {video.video_url}
                  </a>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatLastUpdatedAgo(video.created_at)}
                  </p>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <p className="font-medium text-slate-900">
                      {video.creators?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {video.creators?.platform ?? "—"}
                    </p>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-right">
                  {formatNumber(video.views)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {formatNumber(video.likes)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {formatNumber(video.comments)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {formatNumber(video.shares)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {formatNumber(video.saves)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {canModify ? (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(video)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-kefoo-50 hover:text-kefoo-600"
                        aria-label={`Edit ${video.video_url}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(video)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${video.video_url}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
