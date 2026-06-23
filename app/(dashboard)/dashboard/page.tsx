import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { CampaignPerformanceSection } from "@/components/dashboard/campaign-performance-section";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardPlanUsage } from "@/components/dashboard/dashboard-plan-usage";
import { DashboardScaleSection } from "@/components/dashboard/dashboard-scale-section";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { MonthlyPerformanceSection } from "@/components/dashboard/monthly-performance-section";
import { PlanUpgradePrompt } from "@/components/plan/plan-upgrade-prompt";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { parseDashboardCampaignParam } from "@/lib/dashboard-analytics";
import {
  getDashboardDescription,
  getDashboardTier,
  hasPlanFeature,
} from "@/lib/plan-features";
import { formatOrgPlanLabel } from "@/lib/plan-checkout";
import {
  getDashboardCampaignOptions,
  getDashboardMonthOptions,
  getDashboardStats,
} from "@/lib/data";
import {
  formatMonthLabel,
  formatPlatformLabel,
  parseDashboardMonthParam,
  parseDashboardPlatformParam,
} from "@/lib/dashboard-month-filter";
import {
  formatCPV,
  formatCurrency,
  formatEngagementRate,
  formatNumber,
} from "@/lib/utils";
import { DollarSign, Eye, Megaphone, TrendingUp } from "lucide-react";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string; platform?: string; campaign?: string }>;
};

function buildFilterLabel(
  monthFilter: ReturnType<typeof parseDashboardMonthParam>,
  platformFilter: ReturnType<typeof parseDashboardPlatformParam>,
  campaignName: string | null,
) {
  const parts = [
    monthFilter === "all" ? "All time" : formatMonthLabel(monthFilter),
    campaignName ?? "All campaigns",
    platformFilter === "all" ? null : formatPlatformLabel(platformFilter),
  ].filter(Boolean);

  return parts.join(" · ");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const monthFilter = parseDashboardMonthParam(params.month);
  const platformFilter = parseDashboardPlatformParam(params.platform);
  const planContext = await getDashboardPlanContext();
  const tier = getDashboardTier(planContext.plan);
  const showAdvanced = hasPlanFeature(planContext.plan, "dashboard_advanced");

  const [monthOptions, campaignOptions] = await Promise.all([
    getDashboardMonthOptions(),
    getDashboardCampaignOptions(monthFilter),
  ]);
  const campaignFilter = parseDashboardCampaignParam(
    params.campaign,
    new Set(campaignOptions.map((campaign) => campaign.id)),
  );
  const selectedCampaignName =
    campaignFilter === "all"
      ? null
      : (campaignOptions.find((campaign) => campaign.id === campaignFilter)
          ?.name ?? null);
  const filterLabel = buildFilterLabel(
    monthFilter,
    platformFilter,
    selectedCampaignName,
  );
  const stats = await getDashboardStats(
    monthFilter,
    platformFilter,
    campaignFilter,
  );

  return (
    <>
      <Header
        title="Dashboard"
        description={getDashboardDescription(tier)}
        titleAddon={
          tier !== "none" ? (
            <span className="rounded-full border border-kefoo-200 bg-kefoo-50 px-3 py-1 text-xs font-medium text-kefoo-700">
              {formatOrgPlanLabel(planContext.plan)} plan
            </span>
          ) : null
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mb-6 h-10 w-64 animate-pulse rounded-lg bg-slate-100" />
          }
        >
          <DashboardFilters
            selectedMonth={monthFilter}
            selectedPlatform={platformFilter}
            selectedCampaign={campaignFilter}
            campaigns={campaignOptions}
            currentMonth={monthOptions.currentMonth}
            previousMonths={monthOptions.previousMonths}
          />
        </Suspense>

        <DashboardPlanUsage />

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campaign Overview · {filterLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Active Campaigns"
              value={formatNumber(stats.activeCampaigns)}
              icon={Megaphone}
              accent="indigo"
            />
            <StatCard
              title="Total Budget"
              value={formatCurrency(stats.totalBudget)}
              icon={DollarSign}
              accent="violet"
            />
            <StatCard
              title="Total Views"
              value={formatNumber(stats.totalCampaignViews)}
              subtitle="Across campaign videos"
              icon={Eye}
              accent="emerald"
            />
            <StatCard
              title="Average ER"
              value={formatEngagementRate(stats.averageEngagementRate)}
              subtitle="(likes + comments + shares + saves) / views"
              icon={TrendingUp}
              accent="amber"
            />
            <StatCard
              title="CPV"
              value={formatCPV(stats.totalBudget, stats.totalCampaignViews)}
              subtitle="Budget divided by views"
              icon={TrendingUp}
              accent="indigo"
            />
          </div>
        </section>

        {campaignFilter === "all" ? (
          <CampaignPerformanceSection
            campaigns={stats.workspace.campaignComparison}
          />
        ) : showAdvanced ? (
          <MonthlyPerformanceSection
            months={stats.workspace.monthlyComparison}
            campaignName={selectedCampaignName ?? "Selected campaign"}
          />
        ) : (
          <CampaignPerformanceSection
            campaigns={stats.workspace.campaignComparison}
          />
        )}

        {showAdvanced ? (
          <>
            <DashboardWorkspace workspace={stats.workspace} tier={tier} />

            {tier === "scale" ? <DashboardScaleSection /> : null}
          </>
        ) : (
          <PlanUpgradePrompt
            feature="dashboard_advanced"
            title="Advanced Performance Dashboard"
            description="Compare creators, surface key insights, and track monthly trends with Growth."
            className="mt-8"
          />
        )}
      </main>
    </>
  );
}
