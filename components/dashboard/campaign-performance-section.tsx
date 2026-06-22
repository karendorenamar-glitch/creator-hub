import {
  computeCampaignLeaders,
  MetricComparisonChart,
} from "@/components/dashboard/charts/metric-comparison-chart";
import type { DashboardComparisonRow } from "@/lib/dashboard-analytics";

type CampaignPerformanceSectionProps = {
  campaigns: DashboardComparisonRow[];
};

export function CampaignPerformanceSection({
  campaigns,
}: CampaignPerformanceSectionProps) {
  const leaders = computeCampaignLeaders(campaigns);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Campaign Performance Comparison
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Compare active campaigns side-by-side to spot reach, engagement, and
          cost efficiency leaders instantly.
        </p>
      </div>

      <MetricComparisonChart
        items={campaigns}
        metrics={["views", "saves", "engagementRate", "cpv"]}
        leaders={leaders}
        emptyMessage="Add active campaigns with linked videos to compare performance."
      />
    </section>
  );
}
