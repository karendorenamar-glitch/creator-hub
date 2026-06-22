import type { DashboardComparisonRow, DashboardMonthlyRow } from "@/lib/dashboard-analytics";
import {
  formatEngagementRate,
  formatIDRDecimal,
  formatNumber,
} from "@/lib/utils";

export type ComparisonMetricKey = "views" | "saves" | "engagementRate" | "cpv";

export type ComparisonLeaders = {
  highestViews: string | null;
  highestSaves: string | null;
  bestEr: string | null;
  lowestCpv: string | null;
};

export type MonthlyLeaders = {
  highestViews: string | null;
  highestSaves: string | null;
  bestEr: string | null;
};

type MetricComparisonChartProps = {
  items: Array<DashboardComparisonRow | DashboardMonthlyRow>;
  metrics: ComparisonMetricKey[];
  leaders: ComparisonLeaders | MonthlyLeaders;
  emptyMessage: string;
};

const metricConfig: Record<
  ComparisonMetricKey,
  { label: string; color: string; format: (value: number | null) => string }
> = {
  views: {
    label: "Views",
    color: "bg-kefoo-500",
    format: (value) => formatNumber(value ?? 0),
  },
  saves: {
    label: "Saves",
    color: "bg-violet-500",
    format: (value) => formatNumber(value ?? 0),
  },
  engagementRate: {
    label: "ER",
    color: "bg-emerald-500",
    format: (value) => formatEngagementRate(value ?? 0),
  },
  cpv: {
    label: "CPV",
    color: "bg-amber-500",
    format: (value) => (value == null ? "—" : formatIDRDecimal(value)),
  },
};

function getMetricValue(
  item: DashboardComparisonRow | DashboardMonthlyRow,
  metric: ComparisonMetricKey,
) {
  if (metric === "cpv") {
    return "cpv" in item ? item.cpv : null;
  }

  if (metric === "engagementRate") {
    return item.engagementRate;
  }

  return item[metric];
}

function isLeader(
  item: DashboardComparisonRow | DashboardMonthlyRow,
  metric: ComparisonMetricKey,
  leaders: ComparisonLeaders | MonthlyLeaders,
) {
  if (metric === "views") return item.name === leaders.highestViews;
  if (metric === "saves") return item.name === leaders.highestSaves;
  if (metric === "engagementRate") return item.name === leaders.bestEr;
  if (metric === "cpv" && "lowestCpv" in leaders) {
    return item.name === leaders.lowestCpv;
  }
  return false;
}

function LeaderBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-kefoo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-kefoo-700">
      {label}
    </span>
  );
}

export function computeCampaignLeaders(
  items: DashboardComparisonRow[],
): ComparisonLeaders {
  if (!items.length) {
    return {
      highestViews: null,
      highestSaves: null,
      bestEr: null,
      lowestCpv: null,
    };
  }

  const highestViews = [...items].sort((a, b) => b.views - a.views)[0]?.name ?? null;
  const highestSaves = [...items].sort((a, b) => b.saves - a.saves)[0]?.name ?? null;
  const bestEr = [...items].sort(
    (a, b) => b.engagementRate - a.engagementRate || b.views - a.views,
  )[0]?.name ?? null;
  const lowestCpv = [...items]
    .filter((item) => item.cpv != null && item.views > 0)
    .sort(
      (a, b) =>
        (a.cpv ?? Number.POSITIVE_INFINITY) -
        (b.cpv ?? Number.POSITIVE_INFINITY),
    )[0]?.name ?? null;

  return { highestViews, highestSaves, bestEr, lowestCpv };
}

export function computeMonthlyLeaders(items: DashboardMonthlyRow[]): MonthlyLeaders {
  if (!items.length) {
    return { highestViews: null, highestSaves: null, bestEr: null };
  }

  return {
    highestViews: [...items].sort((a, b) => b.views - a.views)[0]?.name ?? null,
    highestSaves: [...items].sort((a, b) => b.saves - a.saves)[0]?.name ?? null,
    bestEr:
      [...items].sort(
        (a, b) => b.engagementRate - a.engagementRate || b.views - a.views,
      )[0]?.name ?? null,
  };
}

function LeaderSummary({
  leaders,
  metrics,
}: {
  leaders: ComparisonLeaders | MonthlyLeaders;
  metrics: ComparisonMetricKey[];
}) {
  const items = [
    metrics.includes("views") && leaders.highestViews
      ? { label: "Highest Views", value: leaders.highestViews }
      : null,
    metrics.includes("saves") && leaders.highestSaves
      ? { label: "Highest Saves", value: leaders.highestSaves }
      : null,
    metrics.includes("engagementRate") && leaders.bestEr
      ? { label: "Best ER", value: leaders.bestEr }
      : null,
    metrics.includes("cpv") && "lowestCpv" in leaders && leaders.lowestCpv
      ? { label: "Lowest CPV", value: leaders.lowestCpv }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (!items.length) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm"
        >
          <span className="font-medium text-slate-500">{item.label}</span>
          <span className="font-semibold text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MetricComparisonChart({
  items,
  metrics,
  leaders,
  emptyMessage,
}: MetricComparisonChartProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const maxByMetric = metrics.reduce<Record<ComparisonMetricKey, number>>(
    (acc, metric) => {
      const values = items
        .map((item) => getMetricValue(item, metric))
        .filter((value): value is number => value != null && Number.isFinite(value));

      if (metric === "cpv") {
        acc[metric] = Math.max(...values, 0.0001);
      } else if (metric === "engagementRate") {
        acc[metric] = Math.max(...values, 1);
      } else {
        acc[metric] = Math.max(...values, 1);
      }

      return acc;
    },
    { views: 1, saves: 1, engagementRate: 1, cpv: 1 },
  );

  return (
    <div>
      <LeaderSummary leaders={leaders} metrics={metrics} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="truncate text-base font-semibold text-slate-900">
              {item.name}
            </h3>
            <div className="mt-4 space-y-3">
              {metrics.map((metric) => {
                const config = metricConfig[metric];
                const rawValue = getMetricValue(item, metric);
                const numericValue =
                  rawValue == null ? 0 : Number(rawValue);
                const width =
                  metric === "cpv" && numericValue > 0
                    ? Math.max(
                        8,
                        (1 - numericValue / (maxByMetric.cpv * 1.2)) * 100,
                      )
                    : Math.max(
                        (numericValue / maxByMetric[metric]) * 100,
                        rawValue != null && numericValue > 0 ? 8 : 0,
                      );
                const leader = isLeader(item, metric, leaders);

                return (
                  <div key={metric}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        {config.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {leader && (
                          <LeaderBadge
                            label={
                              metric === "cpv"
                                ? "Best"
                                : metric === "engagementRate"
                                  ? "Top ER"
                                  : "Top"
                            }
                          />
                        )}
                        <span className="text-xs font-semibold text-slate-800">
                          {config.format(rawValue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${config.color}`}
                        style={{ width: `${Math.min(width, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
