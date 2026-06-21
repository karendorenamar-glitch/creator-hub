import {
  formatCPV,
  formatEngagementRate,
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";
import type { CampaignAnalytics } from "@/lib/campaign-analytics";

function AnalyticsCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function CampaignAnalyticsGrid({
  analytics,
  budget,
}: {
  analytics: CampaignAnalytics;
  budget: number;
}) {
  const aggregateStats = [
    { label: "Total Views", value: formatNumber(analytics.total_views) },
    { label: "Total Likes", value: formatNumber(analytics.total_likes) },
    { label: "Total Comments", value: formatNumber(analytics.total_comments) },
    { label: "Total Shares", value: formatNumber(analytics.total_shares) },
    { label: "Total Saves", value: formatNumber(analytics.total_saves) },
    {
      label: "Engagement Rate",
      value: formatEngagementRate(analytics.engagement_rate),
    },
    {
      label: "CPV",
      value: formatCPV(budget, analytics.total_views),
    },
  ];

  const creatorKpis = [
    {
      label: "Top Views Creator",
      value: analytics.top_creator?.name ?? "—",
      subtitle: analytics.top_creator
        ? `${formatNumber(analytics.top_creator.total_views)} views`
        : "Link videos to rank creators",
    },
    {
      label: "Best Engagement Creator",
      value: analytics.best_engagement_creator?.name ?? "—",
      subtitle: analytics.best_engagement_creator
        ? `${formatEngagementRate(analytics.best_engagement_creator.engagement_rate)} ER`
        : "Link videos to rank creators",
    },
    {
      label: "Most Efficient Creator",
      value: analytics.most_efficient_creator?.name ?? "—",
      subtitle: analytics.most_efficient_creator
        ? `${formatIDRDecimal(analytics.most_efficient_creator.cpv)} CPV`
        : "Link creators with fees and views",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {aggregateStats.map((stat) => (
          <AnalyticsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {creatorKpis.map((stat) => (
          <AnalyticsCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}

export function CampaignAnalyticsSummary({
  analytics,
  budget,
}: {
  analytics: CampaignAnalytics;
  budget: number;
}) {
  return (
    <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
      <span>Likes {formatNumber(analytics.total_likes)}</span>
      <span>Comments {formatNumber(analytics.total_comments)}</span>
      <span>Shares {formatNumber(analytics.total_shares)}</span>
      <span>Saves {formatNumber(analytics.total_saves)}</span>
      <span>Engagement {formatEngagementRate(analytics.engagement_rate)}</span>
      <span>CPV {formatCPV(budget, analytics.total_views)}</span>
      <span>
        Top creator{" "}
        {analytics.top_creator
          ? `${analytics.top_creator.name} (${formatNumber(analytics.top_creator.total_views)} views)`
          : "—"}
      </span>
    </div>
  );
}
