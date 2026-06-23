import { ComparisonSection } from "@/components/dashboard/comparison-section";
import { ComparisonTable } from "@/components/dashboard/comparison-table";
import { InsightCard } from "@/components/dashboard/insight-card";
import { PlanUpgradePrompt } from "@/components/plan/plan-upgrade-prompt";
import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import type { DashboardTier } from "@/lib/plan-features";
import type { DashboardWorkspaceAnalytics } from "@/lib/dashboard-analytics";

type DashboardWorkspaceProps = {
  workspace: DashboardWorkspaceAnalytics;
  tier: DashboardTier;
};

export function DashboardWorkspace({
  workspace,
  tier,
}: DashboardWorkspaceProps) {
  const { insights, creatorComparison, pillarComparison } = workspace;

  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-2xl border border-kefoo-100 bg-gradient-to-r from-kefoo-50 via-white to-kefoo-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kefoo-600">
          Intelligence Workspace
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Creator Campaign Intelligence Center
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Compare campaigns and creators to decide where to invest next. Built
          for quick answers — not spreadsheet reporting.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Key Insights
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="Top Performer Creator"
            name={insights.topPerformerCreator?.name ?? "—"}
            detail={
              insights.topPerformerCreator?.detail ??
              "Link campaign videos to rank creators"
            }
            meta={insights.topPerformerCreator?.platform}
          />
          <InsightCard
            label="Most Valuable Content"
            name={insights.mostValuableContent?.title ?? "—"}
            detail={
              insights.mostValuableContent?.detail ??
              "Track saves on linked videos"
            }
            meta={
              insights.mostValuableContent
                ? `${insights.mostValuableContent.creatorName} · ${insights.mostValuableContent.platform}`
                : undefined
            }
          />
          <InsightCard
            label="Lowest CPV Creator"
            name={insights.lowestCpvCreator?.name ?? "—"}
            detail={
              insights.lowestCpvCreator?.detail ??
              "Add creator fees to compare CPV"
            }
            meta={insights.lowestCpvCreator?.platform}
          />
          <InsightCard
            label="Best Performing Campaign"
            name={insights.bestPerformingCampaign?.name ?? "—"}
            detail={
              insights.bestPerformingCampaign?.detail ??
              "Add active campaigns with video data"
            }
            meta={insights.bestPerformingCampaign?.platform}
          />
        </div>
      </section>

      <ComparisonSection
        title="Creator Comparison"
        description="Which creators should you hire again based on views, saves, ER, and CPV?"
      >
        <ComparisonTable
          rows={creatorComparison}
          showCpv
          nameLabel="Creator"
          emptyMessage="Link creators and videos to active campaigns to compare performance."
        />
      </ComparisonSection>

      {tier === "growth" ? (
        <PlanUpgradePrompt
          feature="payouts"
          title="Scale reporting and payouts"
          description="Move to Scale for payout management, custom reports, and priority support."
        />
      ) : null}

      {tier === "scale" && CONTENT_PLANNER_ENABLED ? (
        <ComparisonSection
          title="Content Pillar Comparison"
          description="Which content pillars drive the best results across your campaigns?"
        >
          <ComparisonTable
            rows={pillarComparison}
            nameLabel="Content Pillar"
            emptyMessage="Assign content pillars in the Content Planner and link them to campaigns."
          />
        </ComparisonSection>
      ) : null}
    </div>
  );
}
