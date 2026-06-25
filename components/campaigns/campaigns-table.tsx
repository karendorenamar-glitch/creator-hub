"use client";

import Link from "next/link";
import { CampaignAnalyticsSummary } from "@/components/campaigns/campaign-analytics";
import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import {
  formatCPV,
  formatCurrency,
  formatDate,
  formatEngagementRate,
  formatNumber,
} from "@/lib/utils";
import type { CampaignListItem } from "@/types/database";
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

type CampaignsTableProps = {
  campaigns: CampaignListItem[];
  onEdit: (campaign: CampaignListItem) => void;
  onDelete: (campaign: CampaignListItem) => void;
};

export function CampaignsTable({
  campaigns,
  onEdit,
  onDelete,
}: CampaignsTableProps) {
  if (campaigns.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="No campaigns yet"
          description="Create a campaign to organize creators, content, and results in one place."
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell>Brand</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Budget</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Likes</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Comments</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Shares</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Saves</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">
            Engagement
          </DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">CPV</DataTableHeaderCell>
          <DataTableHeaderCell>Top Creator</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {campaigns.map((campaign) => (
            <DataTableRow key={campaign.id}>
              <DataTableCell className="min-w-[220px] whitespace-normal">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-medium text-kefoo-600 hover:text-kefoo-500"
                >
                  {campaign.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(campaign.start_date)} –{" "}
                  {formatDate(campaign.end_date)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {campaign.creator_count} creators · {campaign.video_count}{" "}
                  videos
                </p>
                <div className="lg:hidden">
                  <CampaignAnalyticsSummary
                    analytics={campaign}
                    budget={campaign.budget}
                  />
                </div>
              </DataTableCell>
              <DataTableCell>{campaign.client_name}</DataTableCell>
              <DataTableCell>
                <CampaignStatusBadge status={campaign.status} />
              </DataTableCell>
              <DataTableCell className="text-right font-medium text-slate-900">
                {formatCurrency(campaign.budget)}
              </DataTableCell>
              <DataTableCell className="text-right">
                {formatNumber(campaign.total_views)}
              </DataTableCell>
              <DataTableCell className="hidden text-right lg:table-cell">
                {formatNumber(campaign.total_likes)}
              </DataTableCell>
              <DataTableCell className="hidden text-right lg:table-cell">
                {formatNumber(campaign.total_comments)}
              </DataTableCell>
              <DataTableCell className="hidden text-right xl:table-cell">
                {formatNumber(campaign.total_shares)}
              </DataTableCell>
              <DataTableCell className="hidden text-right xl:table-cell">
                {formatNumber(campaign.total_saves)}
              </DataTableCell>
              <DataTableCell className="hidden text-right lg:table-cell">
                {formatEngagementRate(campaign.engagement_rate)}
              </DataTableCell>
              <DataTableCell className="hidden text-right lg:table-cell">
                {formatCPV(campaign.budget, campaign.total_views)}
              </DataTableCell>
              <DataTableCell className="hidden min-w-[160px] whitespace-normal xl:table-cell">
                {campaign.top_creator ? (
                  <div>
                    <p className="font-medium text-slate-900">
                      {campaign.top_creator.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {campaign.top_creator.platform} ·{" "}
                      {formatNumber(campaign.top_creator.total_views)} views
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </DataTableCell>
              <DataTableCell className="text-right">
                <CampaignRowActions
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  onEdit={() => onEdit(campaign)}
                  onDelete={() => onDelete(campaign)}
                />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
