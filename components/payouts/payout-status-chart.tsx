"use client";

import {
  formatPayoutStatusLabel,
  getPayoutStatusCounts,
} from "@/lib/payouts";
import type { PayoutWithTiming } from "@/types/database";
import { cn } from "@/lib/utils";

type PayoutStatusChartProps = {
  payouts: PayoutWithTiming[];
};

const chartItems = [
  {
    key: "paid" as const,
    label: formatPayoutStatusLabel("PAID"),
    barClassName: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-700",
  },
  {
    key: "pending" as const,
    label: formatPayoutStatusLabel("PENDING"),
    barClassName: "bg-amber-400",
    dotClassName: "bg-amber-400",
    textClassName: "text-amber-700",
  },
];

export function PayoutStatusChart({ payouts }: PayoutStatusChartProps) {
  const counts = getPayoutStatusCounts(payouts);
  const trackedTotal = counts.paid + counts.pending;
  const total = trackedTotal || 1;

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Payment status overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {trackedTotal} payout{trackedTotal === 1 ? "" : "s"} tracked as paid
            or pending payment.
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">
          {trackedTotal}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {chartItems.map((item) => {
          const value = counts[item.key];
          const width = `${(value / total) * 100}%`;

          return (
            <div
              key={item.key}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-2.5 w-2.5 rounded-full", item.dotClassName)}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    item.textClassName,
                  )}
                >
                  {value}
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80"
                role="presentation"
              >
                <div
                  className={cn("h-full rounded-full transition-all", item.barClassName)}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-200/80"
        role="img"
        aria-label={`${counts.paid} paid and ${counts.pending} pending payment`}
      >
        {counts.paid > 0 ? (
          <div
            className="bg-emerald-500"
            style={{ width: `${(counts.paid / total) * 100}%` }}
          />
        ) : null}
        {counts.pending > 0 ? (
          <div
            className="bg-amber-400"
            style={{ width: `${(counts.pending / total) * 100}%` }}
          />
        ) : null}
      </div>
    </section>
  );
}
