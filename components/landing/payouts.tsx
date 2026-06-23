"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExecutionTrackerVisual } from "@/components/landing/features";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
} from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

const payoutRows = [
  {
    creator: "Karen Dorena",
    campaign: "Ramadhan Sale",
    amount: 15_000_000,
    status: "Paid" as const,
  },
  {
    creator: "Alya Putri",
    campaign: "Product Review",
    amount: 8_500_000,
    status: "Pending" as const,
  },
  {
    creator: "Bima Aditya",
    campaign: "Campaign Teaser",
    amount: 6_000_000,
    status: "Pending" as const,
  },
  {
    creator: "Rizky Arif",
    campaign: "Behind The Scene",
    amount: 5_500_000,
    status: "Paid" as const,
  },
];

const statusStyles = {
  Paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const summaryItems = [
  { label: "Total Outstanding", value: 14_500_000, highlight: true },
  { label: "Due in 7 days", value: 6_000_000 },
  { label: "Overdue", value: 8_500_000, danger: true },
];

export function Payouts() {
  return (
    <section className="py-28">
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Track execution and pay creators with confidence
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Execution tracking and payout management built for agency workflows.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn>
            <GlassCard hover={false} className="h-full overflow-hidden p-6 text-center sm:p-8 sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Payouts & Payments
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track payments, due dates, and invoice status in one place.
              </p>

              <div className="mt-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200/70 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-3">Creator</th>
                      <th className="pb-3 pr-3">Campaign</th>
                      <th className="pb-3 pr-3 text-right whitespace-nowrap">Amount</th>
                      <th className="pb-3 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRows.map((row) => (
                      <tr
                        key={`${row.creator}-${row.campaign}`}
                        className="border-b border-slate-200/60 last:border-0"
                      >
                        <td className="py-3 pr-3 text-sm font-medium text-slate-900">
                          {row.creator}
                        </td>
                        <td className="max-w-[7.5rem] truncate py-3 pr-3 text-sm text-slate-600 sm:max-w-none">
                          {row.campaign}
                        </td>
                        <td className="py-3 pr-3 text-right text-sm font-semibold tabular-nums text-slate-200 whitespace-nowrap">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                              statusStyles[row.status],
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid gap-4 border-t border-slate-200/70 pt-6 sm:grid-cols-3">
                {summaryItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p
                      className={cn(
                        "mt-1 text-base font-semibold tabular-nums sm:text-lg",
                        item.danger
                          ? "text-red-400"
                          : item.highlight
                            ? "text-slate-900"
                            : "text-slate-500",
                      )}
                    >
                      {formatMoney(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/payouts"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-kefoo-300 transition-colors hover:text-kefoo-200"
              >
                View all payouts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.08}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6 text-center sm:p-8 sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Execution Tracker
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track each creator from brief through upload inside every campaign.
              </p>
              <ExecutionTrackerVisual />
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-kefoo-300 transition-colors hover:text-kefoo-200"
              >
                See execution tracker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}