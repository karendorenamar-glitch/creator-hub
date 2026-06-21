import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardMonthOptions, getDashboardStats } from "@/lib/data";
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
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Eye,
  Megaphone,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string; platform?: string }>;
};

function buildFilterLabel(
  monthFilter: ReturnType<typeof parseDashboardMonthParam>,
  platformFilter: ReturnType<typeof parseDashboardPlatformParam>,
) {
  const monthLabel =
    monthFilter === "all" ? "All time" : formatMonthLabel(monthFilter);
  const platformLabel = formatPlatformLabel(platformFilter);

  return platformFilter === "all"
    ? monthLabel
    : `${monthLabel} · ${platformLabel}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const monthFilter = parseDashboardMonthParam(params.month);
  const platformFilter = parseDashboardPlatformParam(params.platform);
  const filterLabel = buildFilterLabel(monthFilter, platformFilter);
  const [stats, monthOptions] = await Promise.all([
    getDashboardStats(monthFilter, platformFilter),
    getDashboardMonthOptions(),
  ]);

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your creator network and campaign performance."
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
            currentMonth={monthOptions.currentMonth}
            previousMonths={monthOptions.previousMonths}
          />
        </Suspense>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Campaign Overview · {filterLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Campaigns"
              value={formatNumber(stats.totalCampaigns)}
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
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Creator Performance · {filterLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="CPV"
              value={formatCPV(stats.totalBudget, stats.totalCampaignViews)}
              subtitle="Budget divided by campaign views"
              icon={TrendingUp}
              accent="indigo"
            />
            <StatCard
              title="Top Creator"
              value={stats.topCreator?.name ?? "—"}
              subtitle={
                stats.topCreator
                  ? `${stats.topCreator.platform} · ${formatNumber(stats.topCreator.totalViews)} views`
                  : "Add campaign videos to rank creators"
              }
              icon={Trophy}
              accent="violet"
            />
            <StatCard
              title="Highest ER Creator"
              value={stats.highestErCreator?.name ?? "—"}
              subtitle={
                stats.highestErCreator
                  ? `${stats.highestErCreator.platform} · ${formatEngagementRate(stats.highestErCreator.engagementRate)} ER`
                  : "Add campaign videos to rank creators"
              }
              icon={Sparkles}
              accent="emerald"
            />
            <StatCard
              title="Most Efficient Cost Creator"
              value={stats.mostEfficientCreator?.name ?? "—"}
              subtitle={
                stats.mostEfficientCreator
                  ? `${stats.mostEfficientCreator.platform} · ${formatIDRDecimal(stats.mostEfficientCreator.cpv)} CPV`
                  : "Link creators with fees and views"
              }
              icon={BarChart3}
              accent="amber"
            />
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Welcome to Creator Hub
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Monitor creator growth, manage campaigns, compare video performance,
            and identify your top talent from a single dashboard.
          </p>
        </section>
      </main>
    </>
  );
}
