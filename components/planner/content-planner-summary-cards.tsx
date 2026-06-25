import { getPlannerSummaryCounts } from "@/lib/content-planner";
import type { ContentPlannerAgency } from "@/types/database";

type ContentPlannerSummaryCardsProps = {
  items: ContentPlannerAgency[];
};

type SummaryCardProps = {
  title: string;
  value: number;
};

function SummaryCard({ title, value }: SummaryCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value.toLocaleString("en-US")}
      </p>
    </article>
  );
}

export function ContentPlannerSummaryCards({
  items,
}: ContentPlannerSummaryCardsProps) {
  const counts = getPlannerSummaryCounts(items);

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard title="Idea bank" value={counts.ideaBank} />
      <SummaryCard title="In progress" value={counts.inProgress} />
      <SummaryCard title="Scheduled" value={counts.scheduled} />
      <SummaryCard title="Posted" value={counts.posted} />
    </div>
  );
}
