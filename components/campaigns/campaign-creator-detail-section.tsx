import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
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
import {
  calculateEngagementRate,
  formatCreatorCPE,
  formatCreatorCPV,
  formatCreatorListUsername,
  formatEngagementRate,
  formatIDR,
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";
import { normalizeCampaignCreatorDealType } from "@/lib/campaign-creator-deal";
import type { CampaignCreatorPerformanceDetail } from "@/types/database";
import {
  BarChart3,
  Bookmark,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Video,
} from "lucide-react";

type CampaignCreatorDetailSectionProps = {
  detail: CampaignCreatorPerformanceDetail;
  embedded?: boolean;
};

function CreatorAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kefoo-100 text-xl font-semibold text-kefoo-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function CampaignCreatorDetailSection({
  detail,
  embedded = false,
}: CampaignCreatorDetailSectionProps) {
  const { campaign, creator } = detail;
  const dealType = normalizeCampaignCreatorDealType(creator.deal_type);
  const dealLabel =
    dealType === "paid"
      ? "Campaign Fee"
      : dealType === "barter"
        ? "Barter Value"
        : "Voucher Value";

  return (
    <>
      {!embedded ? (
        <div className="mb-6">
          <Link
            href={`/campaigns/${campaign.id}?view=performance`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaign performance
          </Link>
        </div>
      ) : null}

      {!embedded ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-500">Campaign</p>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{campaign.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{campaign.client_name}</p>
        </div>
      ) : null}

      <div className="mb-8 flex items-start gap-4">
        <CreatorAvatar name={creator.name} />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{creator.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatCreatorListUsername(creator)} · {creator.platform}
          </p>
          {creator.contact ? (
            <p className="mt-1 text-sm text-slate-600">{creator.contact}</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-600">
            Performance in this campaign only
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Fee & Cost Metrics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title={dealLabel}
            value={formatIDR(detail.campaign_fee)}
            subtitle={
              dealType === "paid"
                ? "Fee for this campaign"
                : "Optional estimated value"
            }
            icon={DollarSign}
            accent="indigo"
          />
          <StatCard
            title="Cost Per View"
            value={formatCreatorCPV(detail.campaign_fee, detail.total_views)}
            subtitle="Campaign fee divided by views"
            icon={Eye}
            accent="violet"
          />
          <StatCard
            title="Cost Per Engagement"
            value={formatCreatorCPE(
              detail.campaign_fee,
              detail.total_likes,
              detail.total_comments,
              detail.total_shares,
              detail.total_saves,
            )}
            subtitle="Campaign fee divided by engagements"
            icon={TrendingUp}
            accent="emerald"
          />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Campaign Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Videos"
            value={formatNumber(detail.total_videos)}
            icon={Video}
            accent="indigo"
          />
          <StatCard
            title="Views"
            value={formatNumber(detail.total_views)}
            icon={Eye}
            accent="violet"
          />
          <StatCard
            title="Likes"
            value={formatNumber(detail.total_likes)}
            icon={Heart}
            accent="emerald"
          />
          <StatCard
            title="Comments"
            value={formatNumber(detail.total_comments)}
            icon={MessageCircle}
            accent="amber"
          />
          <StatCard
            title="Shares"
            value={formatNumber(detail.total_shares)}
            icon={Share2}
            accent="indigo"
          />
          <StatCard
            title="Saves"
            value={formatNumber(detail.total_saves)}
            icon={Bookmark}
            accent="emerald"
          />
          <StatCard
            title="Engagement Rate"
            value={formatEngagementRate(detail.average_engagement_rate)}
            subtitle="(likes + comments + shares + saves) / views"
            icon={TrendingUp}
            accent="violet"
          />
          <StatCard
            title="Top Video"
            value={
              detail.top_performing_video
                ? formatNumber(detail.top_performing_video.views)
                : "—"
            }
            subtitle={
              detail.top_performing_video
                ? `${detail.top_performing_video.video_url.slice(0, 48)}${detail.top_performing_video.video_url.length > 48 ? "…" : ""}`
                : "No videos in this campaign"
            }
            icon={BarChart3}
            accent="amber"
          />
        </div>
        {detail.total_views > 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            CPV {formatIDRDecimal(detail.cpv)} · CPE{" "}
            {detail.cpe > 0 ? formatIDRDecimal(detail.cpe) : "—"}
          </p>
        ) : null}
      </section>

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Videos in this campaign
        </h3>
        {detail.videos.length === 0 ? (
          <DataTable>
            <EmptyState
              title="No videos yet"
              description="Videos linked to this campaign from this creator will appear here."
            />
          </DataTable>
        ) : (
          <DataTable>
            <DataTableElement>
              <DataTableHead>
                <DataTableHeaderCell>Video</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Views</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Likes</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Comments</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Shares</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">Saves</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">ER%</DataTableHeaderCell>
              </DataTableHead>
              <DataTableBody>
                {detail.videos.map((video) => (
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
                      {video.views > 0
                        ? formatEngagementRate(
                            calculateEngagementRate(
                              video.views,
                              video.likes,
                              video.comments,
                              video.shares,
                              video.saves,
                            ),
                          )
                        : "—"}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableElement>
          </DataTable>
        )}
      </section>
    </>
  );
}
