"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExecutionTrackerVisual } from "@/components/landing/features";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  FREE_TRIAL_SIGNUP_HREF,
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
    <section className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="hidden h-px w-12 bg-gradient-to-r from-transparent to-slate-200 sm:block" />
              <span className="h-1.5 w-1.5 rounded-full bg-kefoo-400/60" />
              <span className="hidden h-px w-12 bg-gradient-to-l from-transparent to-slate-200 sm:block" />
            </div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Track execution and payouts on your own
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Move creators from brief to payment without spreadsheets or
              back-and-forth with a sales team.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <FadeIn>
            <GlassCard frame className="relative flex h-full min-h-[480px] flex-col overflow-hidden p-6 text-center sm:p-8 sm:text-left lg:translate-y-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-kefoo-500/10 via-kefoo-400/25 to-kefoo-500/10" />
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Execution Tracker
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track each creator from brief through upload inside every campaign.
              </p>
              <ExecutionTrackerVisual />
              <Link
                href={FREE_TRIAL_SIGNUP_HREF}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-kefoo-300 transition-colors hover:text-kefoo-200"
              >
                Try execution tracker free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.08}>
            <GlassCard
              hover={false}
              frame
              className="relative h-full overflow-hidden p-6 text-center sm:p-8 sm:text-left lg:-translate-y-3"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 via-kefoo-500/15 to-slate-200" />
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Payouts & Payments
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track payments, due dates, and invoice status in one place.
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/40 px-4 sm:px-5">
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
                href={FREE_TRIAL_SIGNUP_HREF}
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-kefoo-300 transition-colors hover:text-kefoo-200"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}