"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Lock,
  Pencil,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Video,
  Wallet,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
} from "lucide-react";
import { deleteCampaign } from "@/app/actions/campaigns";
import { CampaignContentPanel } from "@/components/campaigns/campaign-content-panel";
import { CampaignDiscoverPanel } from "@/components/campaigns/campaign-discover-panel";
import { CampaignCreatorsPanel } from "@/components/campaigns/campaign-creators-panel";
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal";
import { CampaignRefreshVideosButton } from "@/components/campaigns/campaign-refresh-videos-button";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExportCsvButton } from "@/components/export/export-csv-button";
import { usePlan, useRequirePlanFeature } from "@/components/plan/plan-provider";
import { useToast } from "@/components/ui/toast";
import { FEATURE_UPGRADE_MESSAGES } from "@/lib/plan-features";
import { markTutorialPerformanceViewed } from "@/lib/workspace-tutorial";
import { getCampaignHealth } from "@/lib/campaign-analytics";
import { getCampaignCreatorDealAmount } from "@/lib/campaign-creator-deal";
import {
  buildCampaignPerformanceCsv,
  getCampaignPerformanceCsvFilename,
} from "@/lib/csv-export";
import {
  formatCPE,
  formatCPV,
  formatCurrency,
  formatDate,
  formatEngagementRate,
  formatIDRDecimal,
  formatNumber,
  cn,
} from "@/lib/utils";
import type { CampaignCreator, CampaignDetail, Creator } from "@/types/database";

type CampaignDetailSectionProps = {
  campaign: CampaignDetail;
  creators: Creator[];
  canEdit: boolean;
  orgId: string;
};

type CampaignDetailView = "content" | "discover" | "performance";

const workflowViews: Array<{
  id: Extract<CampaignDetailView, "content">;
  label: string;
  icon: typeof ClipboardList;
}> = [{ id: "content", label: "Content", icon: ClipboardList }];

function parseCampaignView(
  view: string | null,
  content: string | null,
): CampaignDetailView {
  if (view === "performance") return "performance";
  if (view === "discover") return "discover";
  if (
    view === "content" ||
    view === "execution" ||
    view === "videos" ||
    content === "creators" ||
    content === "paste"
  ) {
    return "content";
  }
  return "content";
}

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
  href,
}: {
  title: string;
  subtitle: string;
  name: string;
  detail: string;
  metric: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-kefoo-50 px-2.5 py-1 text-xs font-semibold text-kefoo-700">
          {metric}
        </span>
      </div>
      <p
        className={cn(
          "mt-4 truncate text-lg font-semibold",
          href ? "text-kefoo-700 group-hover:text-kefoo-600" : "text-slate-900",
        )}
      >
        {name}
      </p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
        <span className="truncate">{detail}</span>
        {href ? (
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-kefoo-500 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-kefoo-200 hover:bg-kefoo-50/40"
        aria-label={`Open video: ${name}`}
      >
        {content}
      </a>
    );
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
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
    badge: "bg-kefoo-50 text-kefoo-700",
    border: "border-kefoo-200",
    accent: "bg-kefoo-500",
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

function getEffectiveCreatorFee(creator: CampaignCreator) {
  return getCampaignCreatorDealAmount(creator);
}

function CampaignBudgetUsage({
  budget,
  creators,
}: {
  budget: number;
  creators: CampaignCreator[];
}) {
  const budgetUsage = useMemo(() => {
    const feesAssigned = creators.reduce(
      (sum, creator) => sum + getEffectiveCreatorFee(creator),
      0,
    );
    const remaining = budget - feesAssigned;
    const isOverBudget = budget > 0 && feesAssigned > budget;
    const overBy = isOverBudget ? feesAssigned - budget : 0;
    const percentUsed =
      budget > 0 ? Math.min((feesAssigned / budget) * 100, 100) : 0;

    return {
      feesAssigned,
      remaining: Math.max(remaining, 0),
      isOverBudget,
      overBy,
      percentUsed,
      creatorsWithFees: creators.filter(
        (creator) => getEffectiveCreatorFee(creator) > 0,
      ).length,
    };
  }, [budget, creators]);

  const {
    feesAssigned,
    remaining,
    isOverBudget,
    overBy,
    percentUsed,
    creatorsWithFees,
  } = budgetUsage;

  const barColor = isOverBudget
    ? "bg-red-500"
    : percentUsed >= 90
      ? "bg-amber-500"
      : "bg-kefoo-500";

  return (
    <section
      className={cn(
        "mb-8 overflow-hidden rounded-xl border bg-white p-6 shadow-sm",
        isOverBudget ? "border-red-200" : "border-slate-200",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Budget usage</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Based on creator fees assigned to this campaign (
            {creatorsWithFees} of {creators.length} creators).
          </p>
        </div>
        {isOverBudget ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Over budget
          </span>
        ) : budget > 0 && percentUsed >= 90 ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Near limit
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Campaign budget
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(budget)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Fees assigned
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold",
              isOverBudget ? "text-red-700" : "text-slate-900",
            )}
          >
            {formatCurrency(feesAssigned)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isOverBudget ? "Over by" : "Remaining"}
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold",
              isOverBudget ? "text-red-700" : "text-emerald-700",
            )}
          >
            {isOverBudget
              ? formatCurrency(overBy)
              : budget > 0
                ? formatCurrency(remaining)
                : "—"}
          </p>
        </div>
      </div>

      {budget > 0 ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>{percentUsed.toFixed(0)}% of budget used</span>
            {isOverBudget ? (
              <span className="font-medium text-red-600">
                {formatCurrency(overBy)} above limit
              </span>
            ) : (
              <span>{formatCurrency(remaining)} left</span>
            )}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Set a campaign budget in Edit to track spending limits.
        </p>
      )}

      {isOverBudget ? (
        <p className="mt-4 text-sm text-red-600">
          Creator fees total {formatCurrency(feesAssigned)} against a{" "}
          {formatCurrency(budget)} budget. Reduce fees or increase the campaign
          budget.
        </p>
      ) : null}
    </section>
  );
}

export function CampaignDetailSection({
  campaign,
  creators,
  canEdit,
  orgId,
}: CampaignDetailSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const requestedContent = searchParams.get("content");
  const initialView = parseCampaignView(requestedView, requestedContent);
  const { showSuccess, showError } = useToast();
  const { hasFeature, openUpgradeModal } = usePlan();
  const requireDiscover = useRequirePlanFeature("discover_keywords");
  const canDiscover = hasFeature("discover_keywords");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeView, setActiveView] = useState<CampaignDetailView>(initialView);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    const nextView = parseCampaignView(requestedView, requestedContent);

    if (nextView === "discover" && !canDiscover) {
      openUpgradeModal(
        FEATURE_UPGRADE_MESSAGES.discover_keywords,
        "/checkout/scale",
      );
      setActiveView("content");
      if (requestedView || requestedContent) {
        router.replace(pathname, { scroll: false });
      }
      return;
    }

    setActiveView(nextView);
  }, [requestedView, requestedContent, canDiscover, openUpgradeModal, pathname, router]);

  useEffect(() => {
    if (activeView === "performance") {
      markTutorialPerformanceViewed(orgId);
    }
  }, [activeView, orgId]);

  function updateUrl(view: CampaignDetailView) {
    const params = new URLSearchParams();
    if (view === "performance") {
      params.set("view", "performance");
    } else if (view === "discover") {
      params.set("view", "discover");
    } else if (view === "content") {
      params.delete("view");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function goToView(view: CampaignDetailView) {
    if (view === "discover") {
      requireDiscover(() => {
        setActiveView(view);
        updateUrl(view);
      });
      return;
    }

    setActiveView(view);
    updateUrl(view);
  }

  const performanceCreatorIds = useMemo(
    () => new Set(campaign.videos.map((video) => video.creator_id)),
    [campaign.videos],
  );
  const performanceCreators = useMemo(
    () =>
      campaign.creators.filter((creator) => performanceCreatorIds.has(creator.id)),
    [campaign.creators, performanceCreatorIds],
  );

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

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {canEdit ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Workflow
          </p>
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {workflowViews.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToView(id)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    activeView === id
                      ? "bg-kefoo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-violet-50 hover:text-kefoo-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Shortcuts
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goToView("discover")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                !canDiscover && "cursor-not-allowed opacity-80",
                activeView === "discover"
                  ? "border-amber-400 bg-amber-50 text-amber-950 shadow-sm"
                  : "border-dashed border-amber-300/80 bg-amber-50/40 text-amber-900 hover:border-amber-400 hover:bg-amber-50",
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span>Discover</span>
              {!canDiscover ? (
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Shortcut
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => goToView("performance")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                activeView === "performance"
                  ? "border-kefoo-600 bg-kefoo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-kefoo-200 hover:text-kefoo-600",
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Performance
            </button>
          </div>
        </div>
      </div>

      {activeView === "content" ? (
        <CampaignContentPanel
          campaign={campaign}
          creators={creators}
          canEdit={canEdit}
        />
      ) : null}

      {activeView === "discover" && canDiscover ? (
        <CampaignDiscoverPanel campaign={campaign} />
      ) : null}

      {activeView === "performance" ? (
        <>
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <ExportCsvButton
          filename={getCampaignPerformanceCsvFilename(campaign.name)}
          buildCsv={() =>
            buildCampaignPerformanceCsv(campaign, performanceCreators)
          }
        />
        <CampaignRefreshVideosButton
          campaignId={campaign.id}
          videoCount={campaign.videos.length}
        />
      </div>

      <CampaignBudgetUsage budget={campaign.budget} creators={performanceCreators} />

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
          value={performanceCreators.length.toLocaleString("en-US")}
        />
        <KpiCard
          label="Videos"
          value={campaign.videos.length.toLocaleString("en-US")}
        />
      </section>

      <CampaignCreatorsPanel campaign={{ ...campaign, creators: performanceCreators }} />

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
            href={campaign.most_valuable_content?.video_url}
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
            href={campaign.best_engagement_content?.video_url}
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
        </>
      ) : null}

      <CampaignFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        campaign={campaign}
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
