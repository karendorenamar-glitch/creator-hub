import {
  computeMonthlyLeaders,
  MetricComparisonChart,
} from "@/components/dashboard/charts/metric-comparison-chart";
import type { DashboardMonthlyRow } from "@/lib/dashboard-analytics";

type MonthlyPerformanceSectionProps = {
  months: DashboardMonthlyRow[];
  campaignName: string;
};

export function MonthlyPerformanceSection({
  months,
  campaignName,
}: MonthlyPerformanceSectionProps) {
  const leaders = computeMonthlyLeaders(months);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Monthly Performance Comparison
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Track how {campaignName} performs month-over-month across views, saves,
          and engagement rate.
        </p>
      </div>

      <MetricComparisonChart
        items={months}
        metrics={["views", "saves", "engagementRate"]}
        leaders={leaders}
        emptyMessage="Link videos to this campaign to compare monthly performance."
      />
    </section>
  );
}
