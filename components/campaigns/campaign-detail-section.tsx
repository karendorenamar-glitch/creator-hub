"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getCampaignHealth } from "@/lib/campaign-analytics";
import {
  formatCPE,
  formatCPV,
  formatCurrency,
  formatDate,
  formatEngagementRate,
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";
import type { CampaignDetail, Creator, VideoWithCreator } from "@/types/database";

type CampaignDetailSectionProps = {
  campaign: CampaignDetail;
  creators: Creator[];
  videos: VideoWithCreator[];
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </article>
  );
}

function InsightCard({
  title,
  subtitle,
  name,
  detail,
  metric,
}: {
  title: string;
  subtitle: string;
  name: string;
  detail: string;
  metric: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {metric}
        </span>
      </div>
      <p className="mt-4 truncate text-lg font-semibold text-slate-900">{name}</p>
      <p className="mt-1 truncate text-sm text-slate-500">{detail}</p>
    </article>
  );
}

const healthStyles = {
  Strong: {
    badge: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },
  "On Track": {
    badge: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-200",
    accent: "bg-indigo-500",
  },
  "Needs Attention": {
    badge: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },
  "Insufficient Data": {
    badge: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    accent: "bg-slate-400",
  },
} as const;

export function CampaignDetailSection({
  campaign,
  creators,
  videos,
}: CampaignDetailSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const health = getCampaignHealth(campaign, campaign.videos.length);
  const healthStyle = healthStyles[health.status];

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCampaign(campaign.id);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(`"${campaign.name}" was deleted.`);
      router.push("/campaigns");
    });
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to campaigns
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {campaign.name}
            </h2>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{campaign.client_name}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>
              {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(campaign.budget)} budget
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <section className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total Views" value={formatNumber(campaign.total_views)} />
        <KpiCard label="Total Likes" value={formatNumber(campaign.total_likes)} />
        <KpiCard
          label="Total Comments"
          value={formatNumber(campaign.total_comments)}
        />
        <KpiCard label="Total Shares" value={formatNumber(campaign.total_shares)} />
        <KpiCard label="Total Saves" value={formatNumber(campaign.total_saves)} />
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Average ER"
          value={formatEngagementRate(campaign.engagement_rate)}
        />
        <KpiCard
          label="CPV"
          value={formatCPV(campaign.budget, campaign.total_views)}
        />
        <KpiCard
          label="CPE"
          value={formatCPE(
            campaign.budget,
            campaign.total_likes +
              campaign.total_comments +
              campaign.total_shares +
              campaign.total_saves,
          )}
        />
        <KpiCard
          label="Creators"
          value={campaign.creators.length.toLocaleString("en-US")}
        />
        <KpiCard
          label="Videos"
          value={campaign.videos.length.toLocaleString("en-US")}
        />
      </section>

      <section className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Insights</h3>
          <p className="mt-1 text-sm text-slate-500">
            Key performers and content highlights for this campaign.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <InsightCard
            title="Top Performer Creator"
            subtitle="Highest total views"
            name={campaign.top_creator?.name ?? "—"}
            detail={
              campaign.top_creator
                ? `${campaign.top_creator.platform} · ${formatNumber(campaign.top_creator.total_views)} views`
                : "Link creators and videos to surface top reach."
            }
            metric={
              campaign.top_creator
                ? formatNumber(campaign.top_creator.total_views)
                : "—"
            }
          />
          <InsightCard
            title="Most Valuable Content"
            subtitle="Highest saves"
            name={campaign.most_valuable_content?.title ?? "—"}
            detail={
              campaign.most_valuable_content
                ? `${campaign.most_valuable_content.creator_name} · ${campaign.most_valuable_content.platform}`
                : "Link videos with save data to rank content value."
            }
            metric={campaign.most_valuable_content?.metric_value ?? "—"}
          />
          <InsightCard
            title="Best Engagement Content"
            subtitle="Highest ER"
            name={campaign.best_engagement_content?.title ?? "—"}
            detail={
              campaign.best_engagement_content
                ? `${campaign.best_engagement_content.creator_name} · ${campaign.best_engagement_content.platform}`
                : "Link videos with views to rank engagement."
            }
            metric={campaign.best_engagement_content?.metric_value ?? "—"}
          />
          <InsightCard
            title="Most Cost Efficient Creator"
            subtitle="Lowest CPV"
            name={campaign.most_efficient_creator?.name ?? "—"}
            detail={
              campaign.most_efficient_creator
                ? `${campaign.most_efficient_creator.platform} · ${formatIDRDecimal(campaign.most_efficient_creator.cpv)} per view`
                : "Assign creator fees and link videos to calculate CPV."
            }
            metric={
              campaign.most_efficient_creator
                ? formatIDRDecimal(campaign.most_efficient_creator.cpv)
                : "—"
            }
          />
        </div>
      </section>

      <section
        className={`overflow-hidden rounded-xl border bg-white shadow-sm ${healthStyle.border}`}
      >
        <div className="flex">
          <div className={`w-1 shrink-0 ${healthStyle.accent}`} />
          <div className="flex-1 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">
                Campaign Health
              </h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${healthStyle.badge}`}
              >
                {health.status}
              </span>
            </div>
            <p className="mt-3 text-base font-medium text-slate-900">
              {health.headline}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {health.detail}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {campaign.creators.length} creators
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                {campaign.videos.length} videos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {formatNumber(campaign.total_likes)} likes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {formatNumber(campaign.total_comments)} comments
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                {formatNumber(campaign.total_shares)} shares
              </span>
            </div>
          </div>
        </div>
      </section>

      <CampaignFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        campaign={campaign}
        creators={creators}
        videos={videos}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete campaign?"
        description={`This will permanently remove "${campaign.name}" and unlink all associated content planner items.`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
