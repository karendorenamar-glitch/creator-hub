"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
} from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";

const payoutRows = [
  {
    creator: "Karen Dorena",
    campaign: "Ramadhan Sale",
    amount: "Rp 15.000.000",
    status: "Paid" as const,
  },
  {
    creator: "Alya Putri",
    campaign: "Product Review",
    amount: "Rp 8.500.000",
    status: "Pending" as const,
  },
  {
    creator: "Bima Aditya",
    campaign: "Campaign Teaser",
    amount: "Rp 6.000.000",
    status: "Pending" as const,
  },
  {
    creator: "Rizky Arif",
    campaign: "Behind The Scene",
    amount: "Rp 5.500.000",
    status: "Paid" as const,
  },
];

const statusStyles = {
  Paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const summaryItems = [
  { label: "Total Outstanding", value: "Rp 14.500.000", highlight: true },
  { label: "Due in 7 days", value: "Rp 6.000.000" },
  { label: "Overdue", value: "Rp 8.500.000", danger: true },
];

export function Payouts() {
  return (
    <section className="py-28">
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <GlassCard hover={false} className="overflow-hidden">
            <div className="grid lg:grid-cols-[1fr_280px]">
              <div className="border-b border-white/[0.06] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Payouts & Payments
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                  Track payments, due dates, and invoice status in one place.
                </p>

                <div className="mt-8 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4">Creator</th>
                        <th className="pb-3 pr-4">Campaign</th>
                        <th className="pb-3 pr-4 text-right">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRows.map((row) => (
                        <tr
                          key={`${row.creator}-${row.campaign}`}
                          className="border-b border-white/[0.04] last:border-0"
                        >
                          <td className="py-3.5 pr-4 text-sm font-medium text-white">
                            {row.creator}
                          </td>
                          <td className="py-3.5 pr-4 text-sm text-slate-400">
                            {row.campaign}
                          </td>
                          <td className="py-3.5 pr-4 text-right font-mono text-sm tabular-nums text-slate-200">
                            {row.amount}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
              </div>

              <div className="flex flex-col justify-between bg-white/[0.02] p-6 sm:p-8">
                <div className="space-y-5">
                  {summaryItems.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p
                        className={cn(
                          "mt-1 font-mono text-lg font-semibold tabular-nums",
                          item.danger
                            ? "text-red-400"
                            : item.highlight
                              ? "text-white"
                              : "text-slate-300",
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/payouts"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
                >
                  View all payouts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  );
}
