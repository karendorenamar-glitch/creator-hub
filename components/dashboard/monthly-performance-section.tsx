import {
  computeCampaignLeaders,
  MetricComparisonChart,
} from "@/components/dashboard/charts/metric-comparison-chart";
import type { DashboardMonthlyCampaignComparison } from "@/lib/dashboard-analytics";
import { MAX_DASHBOARD_COMPARE_MONTHS } from "@/lib/dashboard-month-filter";
import {
  formatEngagementRate,
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";

type MonthlyPerformanceSectionProps = {
  monthlyComparisons: DashboardMonthlyCampaignComparison[];
  selectedMonthCount?: number;
  embedded?: boolean;
};

function CampaignComparisonTable({
  campaigns,
}: {
  campaigns: DashboardMonthlyCampaignComparison["campaigns"];
}) {
  if (campaigns.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Campaign
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              Views
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              Saves
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              ER
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              CPV
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                {campaign.name}
              </td>
              <td className="px-4 py-3 text-right text-slate-700">
                {formatNumber(campaign.views)}
              </td>
              <td className="px-4 py-3 text-right text-slate-700">
                {formatNumber(campaign.saves)}
              </td>
              <td className="px-4 py-3 text-right text-slate-700">
                {formatEngagementRate(campaign.engagementRate)}
              </td>
              <td className="px-4 py-3 text-right text-slate-700">
                {campaign.cpv == null ? "—" : formatIDRDecimal(campaign.cpv)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonthlyPerformanceSection({
  monthlyComparisons,
  selectedMonthCount = 0,
  embedded = false,
}: MonthlyPerformanceSectionProps) {
  const canCompare = selectedMonthCount >= 1 && monthlyComparisons.length > 0;

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          : "mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Per Month</h3>
        <p className="mt-1 text-sm text-slate-500">
          Compare campaigns within each selected month using the chart and table
          below.
        </p>
      </div>

      {!canCompare ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Select months in the filter (max {MAX_DASHBOARD_COMPARE_MONTHS}) to
          compare campaigns month by month.
        </div>
      ) : (
        <div className="space-y-10">
          {monthlyComparisons.map((month) => {
            const leaders = computeCampaignLeaders(month.campaigns);

            return (
              <div key={month.monthId}>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-900">
                    {month.monthLabel}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Campaign comparison for this month.
                  </p>
                </div>

                <MetricComparisonChart
                  items={month.campaigns}
                  metrics={["views", "saves", "engagementRate", "cpv"]}
                  leaders={leaders}
                  emptyMessage="No linked videos for these campaigns in this month."
                />

                <div className="mt-5">
                  <CampaignComparisonTable campaigns={month.campaigns} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
