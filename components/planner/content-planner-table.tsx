"use client";

import { ActionMenu } from "@/components/ui/action-menu";
import { getCampaignNameById } from "@/lib/campaigns";
import {
  formatCreatorNames,
  formatPlannedDate,
  getContentPlannerStatusStyle,
  getInspirationUrl,
} from "@/lib/content-planner";
import { cn } from "@/lib/utils";
import type { CampaignOption, ContentPlannerAgency } from "@/types/database";
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

type ContentPlannerTableProps = {
  rows: ContentPlannerAgency[];
  campaigns: CampaignOption[];
  onEdit: (item: ContentPlannerAgency) => void;
  onViewDetails: (item: ContentPlannerAgency) => void;
  onDelete: (item: ContentPlannerAgency) => void;
};

function ClampedCellText({
  text,
  className,
  emptyLabel = "—",
}: {
  text: string;
  className?: string;
  emptyLabel?: string;
}) {
  const trimmed = text.trim();

  if (!trimmed) {
    return <span className={className}>{emptyLabel}</span>;
  }

  return (
    <span
      title={trimmed}
      className={cn(
        "block max-w-xs whitespace-normal line-clamp-2 leading-snug",
        className,
      )}
    >
      {trimmed}
    </span>
  );
}

function InspirationReferenceCell({
  url,
}: {
  url: string | null | undefined;
}) {
  const inspirationUrl = getInspirationUrl(url);

  if (!inspirationUrl) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <a
      href={inspirationUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open reference link"
      title="Open reference link"
      className="inline-flex rounded-md p-1 text-base transition-colors hover:bg-kefoo-50"
      onClick={(event) => event.stopPropagation()}
    >
      🔗
    </a>
  );
}

const plannerCellClassName = "whitespace-normal py-5 align-top";

export function ContentPlannerTable({
  rows,
  campaigns,
  onEdit,
  onViewDetails,
  onDelete,
}: ContentPlannerTableProps) {
  if (rows.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="Content planner is empty"
          description="Add your first idea to map pillars, creators, and publish dates."
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Content Pillar</DataTableHeaderCell>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell>Content Idea / SOW</DataTableHeaderCell>
          <DataTableHeaderCell>Hook</DataTableHeaderCell>
          <DataTableHeaderCell>Reference</DataTableHeaderCell>
          <DataTableHeaderCell>Creators</DataTableHeaderCell>
          <DataTableHeaderCell>Platform</DataTableHeaderCell>
          <DataTableHeaderCell>Date</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">
            Actions
          </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {rows.map((row) => (
            <DataTableRow key={row.id}>
              <DataTableCell
                className={cn(plannerCellClassName, "font-medium text-slate-900")}
              >
                {row.content_pillar}
              </DataTableCell>
              <DataTableCell
                className={cn(plannerCellClassName, "max-w-[10rem] truncate text-slate-600")}
              >
                {getCampaignNameById(row.campaign_id, campaigns)}
              </DataTableCell>
              <DataTableCell className={plannerCellClassName}>
                <ClampedCellText
                  text={row.content_idea}
                  className="font-semibold text-slate-900"
                />
              </DataTableCell>
              <DataTableCell className={plannerCellClassName}>
                <ClampedCellText
                  text={row.hook}
                  className="text-xs text-slate-500"
                />
              </DataTableCell>
              <DataTableCell className={plannerCellClassName}>
                <InspirationReferenceCell url={row.inspiration_url} />
              </DataTableCell>
              <DataTableCell
                className={cn(plannerCellClassName, "text-slate-600")}
              >
                {formatCreatorNames(row.creator_names)}
              </DataTableCell>
              <DataTableCell className={plannerCellClassName}>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {row.platform}
                </span>
              </DataTableCell>
              <DataTableCell
                className={cn(plannerCellClassName, "text-slate-600")}
              >
                {formatPlannedDate(row.planned_date)}
              </DataTableCell>
              <DataTableCell className={plannerCellClassName}>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getContentPlannerStatusStyle(row.status)}`}
                >
                  {row.status}
                </span>
              </DataTableCell>
              <DataTableCell
                className={cn(plannerCellClassName, "text-right")}
              >
                <div className="flex justify-end">
                  <ActionMenu
                    ariaLabel={`Actions for ${row.content_pillar}`}
                    items={[
                      {
                        label: "👀 View Details",
                        onClick: () => onViewDetails(row),
                      },
                      {
                        label: "✏️ Edit",
                        onClick: () => onEdit(row),
                      },
                      {
                        label: "🗑 Delete",
                        onClick: () => onDelete(row),
                        variant: "danger",
                      },
                    ]}
                  />
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
