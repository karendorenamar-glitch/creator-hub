import { formatEngagementRate, formatIDRDecimal, formatNumber } from "@/lib/utils";
import type {
  DashboardComparisonRow,
  DashboardPillarComparisonRow,
} from "@/lib/dashboard-analytics";

type ComparisonTableProps = {
  rows: DashboardComparisonRow[] | DashboardPillarComparisonRow[];
  showCpv?: boolean;
  emptyMessage: string;
  nameLabel?: string;
};

function formatCpv(value: number | null | undefined) {
  if (value == null) return "—";
  return formatIDRDecimal(value);
}

export function ComparisonTable({
  rows,
  showCpv = false,
  emptyMessage,
  nameLabel = "Name",
}: ComparisonTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {nameLabel}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Views
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Saves
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              ER
            </th>
            {showCpv && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                CPV
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => {
            const isTop = index === 0;
            const meta = "meta" in row ? row.meta : undefined;

            return (
              <tr
                key={row.id}
                className={isTop ? "bg-kefoo-50/40" : undefined}
              >
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.name}</p>
                  {meta && (
                    <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatNumber(row.views)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatNumber(row.saves)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatEngagementRate(row.engagementRate)}
                </td>
                {showCpv && (
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCpv("cpv" in row ? row.cpv : null)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
