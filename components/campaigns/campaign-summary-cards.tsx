import Link from "next/link";
import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { canEditCampaign } from "@/lib/org-team";
import { formatCurrency } from "@/lib/utils";
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
            className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-kefoo-200 hover:bg-kefoo-50/30"
          >
            <Link
              href={`/campaigns/${campaign.id}`}
              className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-kefoo-500 focus-visible:ring-offset-2"
              aria-label={`Open ${campaign.name}`}
            />

            <div className="pointer-events-none relative z-[1]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 group-hover:text-kefoo-700">
                    {campaign.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {campaign.client_name}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-900">
                {formatCurrency(campaign.budget)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Campaign budget</p>
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
