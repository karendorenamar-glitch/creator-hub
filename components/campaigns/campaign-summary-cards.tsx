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
  onEdit: (campaign: CampaignSummary) => void;
  onDelete: (campaign: CampaignSummary) => void;
};

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1 text-center">
      <p className="text-xs font-medium tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export function CampaignSummaryCards({
  campaigns,
  currentUserId,
  memberRole,
  onEdit,
  onDelete,
}: CampaignSummaryCardsProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-sm font-semibold tracking-tight text-slate-900">No campaigns yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Create your first campaign to organize creators, content, and results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <article
          key={campaign.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/campaigns/${campaign.id}`}
                className="block truncate text-lg font-semibold tracking-tight text-kefoo-600 hover:text-kefoo-500"
              >
                {campaign.name}
              </Link>
              <p className="mt-1 truncate text-sm text-slate-500">
                {campaign.client_name}
              </p>
            </div>
            <CampaignStatusBadge status={campaign.status} />
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-5">
            <MetricBlock
              label="Budget"
              value={formatCurrency(campaign.budget)}
            />
            <MetricBlock
              label="Creators"
              value={campaign.creator_count.toLocaleString("en-US")}
            />
            <MetricBlock
              label="Videos"
              value={campaign.video_count.toLocaleString("en-US")}
            />
          </div>

          <CampaignRowActions
            campaignId={campaign.id}
            campaignName={campaign.name}
            onEdit={() => onEdit(campaign)}
            onDelete={() => onDelete(campaign)}
            canEdit={canEditCampaign({
              role: memberRole,
              userId: currentUserId,
              createdBy: campaign.created_by,
            })}
            canDelete={canEditCampaign({
              role: memberRole,
              userId: currentUserId,
              createdBy: campaign.created_by,
            })}
            className="mt-5 border-t border-slate-100 pt-4"
          />
        </article>
      ))}
    </div>
  );
}
