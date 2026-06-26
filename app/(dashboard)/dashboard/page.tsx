import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardPlanUsage } from "@/components/dashboard/dashboard-plan-usage";
import { DashboardRefreshVideos } from "@/components/dashboard/dashboard-refresh-videos";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { MonthlyPerformanceSection } from "@/components/dashboard/monthly-performance-section";
import { PlanUpgradePrompt } from "@/components/plan/plan-upgrade-prompt";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getLeaderTeamFilterContext } from "@/app/actions/team";
import { formatCampaignsLabel, parseDashboardCampaignsParam } from "@/lib/dashboard-analytics";
import {
  parseTeamFilterParam,
  resolveTeamFilterForRole,
  shouldShowTeamFilter,
} from "@/lib/team-filter";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";
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
  buildAvailableDashboardMonths,
  formatMonthsLabel,
  formatPlatformLabel,
  parseDashboardMonthsParam,
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
  searchParams: Promise<{
    month?: string;
    months?: string;
    platform?: string;
    campaign?: string;
    campaigns?: string;
    team?: string;
  }>;
};

function buildFilterLabel(
  monthFilters: ReturnType<typeof parseDashboardMonthsParam>,
  platformFilter: ReturnType<typeof parseDashboardPlatformParam>,
  campaignFilters: string[],
  campaignOptions: Array<{ id: string; name: string }>,
) {
  const parts = [
    formatMonthsLabel(monthFilters),
    formatCampaignsLabel(campaignFilters, campaignOptions),
    platformFilter === "all" ? null : formatPlatformLabel(platformFilter),
  ].filter(Boolean);

  return parts.join(" · ");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const platformFilter = parseDashboardPlatformParam(params.platform);
  const planContext = await getDashboardPlanContext();
  const tier = getDashboardTier(planContext.plan, planContext.addOnFeatures);
  const showAdvanced = hasPlanFeature(
    planContext.plan,
    "dashboard_advanced",
    planContext.addOnFeatures,
  );
  const showDashboardCampaigns = hasPlanFeature(
    planContext.plan,
    "dashboard",
    planContext.addOnFeatures,
  );
  const activeCampaignsNote = showDashboardCampaigns
    ? getMessage(locale, "dashboard.activeCampaignsOnly")
    : undefined;

  const [monthOptions, campaignOptions, teamContext, membership] =
    await Promise.all([
      getDashboardMonthOptions(),
      getDashboardCampaignOptions(),
      getLeaderTeamFilterContext(),
      getOrgMembershipForAction(),
    ]);

  const availableMonths = buildAvailableDashboardMonths(monthOptions);
  const availableMonthSet = new Set(availableMonths);
  const monthFilters = parseDashboardMonthsParam(
    params.months ?? params.month,
    availableMonthSet,
  );
  const memberIds = new Set(teamContext.members.map((member) => member.id));
  const parsedTeamFilter = parseTeamFilterParam(params.team, memberIds);
  const teamFilter = resolveTeamFilterForRole(
    "error" in membership ? "team" : membership.role,
    parsedTeamFilter,
  );
  const showTeamFilter = shouldShowTeamFilter(
    teamContext.isLeader,
    planContext.plan,
  );
  const campaignIdSet = new Set(campaignOptions.map((campaign) => campaign.id));
  const campaignFilters = parseDashboardCampaignsParam(
    params.campaigns ?? params.campaign,
    campaignIdSet,
  );
  const filterLabel = buildFilterLabel(
    monthFilters,
    platformFilter,
    campaignFilters,
    campaignOptions,
  );
  const stats = await getDashboardStats(
    monthFilters,
    platformFilter,
    campaignFilters,
    teamFilter,
  );

  return (
    <>
      <Header
        title={getMessage(locale, "pages.dashboard.title")}
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
            selectedMonths={monthFilters}
            selectedPlatform={platformFilter}
            selectedCampaigns={campaignFilters}
            selectedTeam={teamFilter}
            campaigns={campaignOptions}
            campaignsNote={activeCampaignsNote}
            teamMembers={teamContext.members}
            showTeamFilter={showTeamFilter}
            availableMonths={availableMonths}
            currentMonth={monthOptions.currentMonth}
          />
        </Suspense>

        {activeCampaignsNote ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {activeCampaignsNote}
          </div>
        ) : null}

        <DashboardPlanUsage />

        {showAdvanced ? (
          <div className="mb-4 flex justify-end">
            <DashboardRefreshVideos
              campaignIds={campaignFilters}
              hasVideos={stats.activeCampaigns > 0}
            />
          </div>
        ) : null}

        <section>
          <h2 className="mb-4 text-sm font-semibold text-slate-600">
            {getMessage(locale, "dashboard.campaignOverview")} · {filterLabel}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title={getMessage(locale, "dashboard.activeCampaigns")}
              value={formatNumber(stats.activeCampaigns)}
              icon={Megaphone}
              accent="indigo"
            />
            <StatCard
              title={getMessage(locale, "dashboard.totalBudget")}
              value={formatCurrency(stats.totalBudget)}
              icon={DollarSign}
              accent="violet"
            />
            <StatCard
              title={getMessage(locale, "dashboard.totalViews")}
              value={formatNumber(stats.totalCampaignViews)}
              subtitle={getMessage(locale, "dashboard.totalViewsSubtitle")}
              icon={Eye}
              accent="emerald"
            />
            <StatCard
              title={getMessage(locale, "dashboard.averageEr")}
              value={formatEngagementRate(stats.averageEngagementRate)}
              subtitle={getMessage(locale, "dashboard.averageErSubtitle")}
              icon={TrendingUp}
              accent="amber"
            />
            <StatCard
              title={getMessage(locale, "dashboard.cpv")}
              value={formatCPV(stats.totalBudget, stats.totalCampaignViews)}
              subtitle={getMessage(locale, "dashboard.cpvSubtitle")}
              icon={TrendingUp}
              accent="indigo"
            />
          </div>
        </section>

        {showAdvanced ? (
          <DashboardWorkspace workspace={stats.workspace} tier={tier} />
        ) : (
          <PlanUpgradePrompt
            feature="dashboard_advanced"
            title={getMessage(locale, "dashboard.advancedUpgradeTitle")}
            description={getMessage(locale, "dashboard.advancedUpgradeDescription")}
            className="mt-8"
          />
        )}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-600">
              {getMessage(locale, "dashboard.performanceComparison")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {getMessage(locale, "dashboard.performanceComparisonDescription")}
            </p>
          </div>

          <MonthlyPerformanceSection
            monthlyComparisons={stats.workspace.monthlyCampaignComparison}
            selectedMonthCount={monthFilters.length}
            embedded
          />
        </section>
      </main>
    </>
  );
}
