import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { formatCurrency } from "@/lib/utils";
import type { CampaignSummary } from "@/types/database";

type CampaignSummaryCardsProps = {
  campaigns: CampaignSummary[];
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
  onEdit,
  onDelete,
}: CampaignSummaryCardsProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">No campaigns yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first campaign to organize content and creators.
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

          <div className="mt-5 flex justify-end gap-1 border-t border-slate-100 pt-4">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label={`View ${campaign.name}`}
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => onEdit(campaign)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-kefoo-50 hover:text-kefoo-600"
              aria-label={`Edit ${campaign.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(campaign)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${campaign.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
