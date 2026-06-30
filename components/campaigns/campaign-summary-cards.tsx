import Link from "next/link";
import { ChevronRight, Users, Video } from "lucide-react";
import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { canEditCampaign } from "@/lib/org-team";
import { formatDate } from "@/lib/utils";
import type { CampaignSummary, OrgMemberRole } from "@/types/database";

type CampaignSummaryCardsProps = {
  campaigns: CampaignSummary[];
  currentUserId: string;
  memberRole: OrgMemberRole;
  onDelete: (campaign: CampaignSummary) => void;
};

export function CampaignSummaryCards({
  campaigns,
  currentUserId,
  memberRole,
  onDelete,
}: CampaignSummaryCardsProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-sm font-semibold tracking-tight text-slate-900">No campaigns yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Create your first campaign, then add creators in Content and paste
          video links or use Discover.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => {
        const canDelete = canEditCampaign({
          role: memberRole,
          userId: currentUserId,
          createdBy: campaign.created_by,
        });

        return (
          <article
            key={campaign.id}
            className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-kefoo-300 hover:shadow-md active:translate-y-0"
          >
            <Link
              href={`/campaigns/${campaign.id}`}
              className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-kefoo-500 focus-visible:ring-offset-2"
              aria-label={`Open ${campaign.name}`}
            />

            <div className="pointer-events-none relative z-[1]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-kefoo-700">
                    {campaign.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {campaign.client_name}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </div>

              <p className="mt-4 text-sm text-slate-600">
                {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {campaign.creator_count} creator
                  {campaign.creator_count === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" aria-hidden />
                  {campaign.video_count} video
                  {campaign.video_count === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-kefoo-600 transition-colors group-hover:text-kefoo-500">
                <span>Open campaign</span>
                <ChevronRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </div>

            {canDelete ? (
              <CampaignRowActions
                campaignName={campaign.name}
                onDelete={() => onDelete(campaign)}
                canEdit={false}
                canDelete
                className="relative z-10 mt-5 border-t border-slate-100 pt-4"
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
