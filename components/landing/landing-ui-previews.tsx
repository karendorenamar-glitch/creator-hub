import type { ReactNode } from "react";
import { CalendarDays, LineChart, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function ShowcasePanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="landing-card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-xs font-medium text-slate-400">{title}</p>
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

const creatorComparison = [
  {
    rank: 1,
    name: "Karen Dorena",
    views: "1.4M",
    saves: "8.1K",
    er: "6.8%",
    cpv: "Rp 39",
  },
  {
    rank: 2,
    name: "Sarah Chen",
    views: "980K",
    saves: "6.2K",
    er: "5.9%",
    cpv: "Rp 44",
  },
  {
    rank: 3,
    name: "Marcus Lee",
    views: "720K",
    saves: "4.8K",
    er: "5.1%",
    cpv: "Rp 51",
  },
];

const monthlyBars = [
  { month: "Jan", value: 52 },
  { month: "Feb", value: 61 },
  { month: "Mar", value: 58 },
  { month: "Apr", value: 74 },
  { month: "May", value: 68 },
  { month: "Jun", value: 88 },
];

const plannerColumns = [
  { label: "Idea Bank", count: 4, color: "bg-slate-500/20 text-slate-300" },
  { label: "In Progress", count: 3, color: "bg-violet-500/20 text-violet-300" },
  { label: "Scheduled", count: 5, color: "bg-kefoo-500/20 text-kefoo-300" },
  { label: "Posted", count: 12, color: "bg-emerald-500/20 text-emerald-300" },
];

export function WhatKefooDoesSection() {
  const cards = [
    {
      title: "Creator Performance Intelligence",
      description: "Identify top-performing creators automatically",
      icon: Users,
    },
    {
      title: "Campaign Comparison System",
      description: "Compare performance across campaigns & time periods",
      icon: LineChart,
    },
    {
      title: "Cost Efficiency Insights",
      description: "Understand which creators give best value per result",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="landing-card-hover rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-violet-500/15 to-kefoo-500/10 p-2.5">
            <card.icon className="h-4 w-4 text-violet-300" />
          </div>
          <h3 className="text-base font-semibold text-white">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {card.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DashboardShowcaseSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ShowcasePanel title="Creator Comparison">
        <div className="mb-2 grid grid-cols-[1fr_0.6fr_0.5fr_0.5fr_0.5fr] gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
          <span>Creator</span>
          <span className="text-right">Views</span>
          <span className="text-right">Saves</span>
          <span className="text-right">ER</span>
          <span className="text-right">CPV</span>
        </div>
        <div className="space-y-2">
          {creatorComparison.map((row) => (
            <div
              key={row.rank}
              className="grid grid-cols-[1fr_0.6fr_0.5fr_0.5fr_0.5fr] gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2 py-2 text-[11px]"
            >
              <span className="truncate font-medium text-white">
                #{row.rank} {row.name}
              </span>
              <span className="text-right font-mono text-slate-400">
                {row.views}
              </span>
              <span className="text-right font-mono text-slate-400">
                {row.saves}
              </span>
              <span className="text-right font-mono text-slate-400">
                {row.er}
              </span>
              <span className="text-right font-mono text-violet-300">
                {row.cpv}
              </span>
            </div>
          ))}
        </div>
      </ShowcasePanel>

      <ShowcasePanel title="Campaign Performance">
        <div className="flex h-28 items-end gap-1.5">
          {monthlyBars.map((bar) => (
            <div key={bar.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/80 to-kefoo-400/70"
                style={{ height: `${bar.value}%` }}
              />
              <span className="text-[8px] text-slate-500">{bar.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
          {[
            { name: "Summer Launch", value: "3.1M views" },
            { name: "Brand Refresh", value: "1.8M views" },
          ].map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="text-slate-400">{c.name}</span>
              <span className="font-mono text-slate-300">{c.value}</span>
            </div>
          ))}
        </div>
      </ShowcasePanel>

      <ShowcasePanel title="Content Planner">
        <div className="grid grid-cols-2 gap-2">
          {plannerColumns.map((col) => (
            <div
              key={col.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
            >
              <p className="text-[10px] text-slate-500">{col.label}</p>
              <p className={cn("mt-1 inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium", col.color)}>
                {col.count}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] text-slate-500">
            <CalendarDays className="h-3 w-3" />
            <span>June</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-slate-600">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded py-0.5",
                  [3, 7, 11].includes(i)
                    ? "bg-violet-500/25 text-violet-200"
                    : "text-slate-500",
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </ShowcasePanel>
    </div>
  );
}

const payoutRows = [
  {
    creator: "Karen Dorena",
    amount: "Rp 12M",
    status: "Pending" as const,
    timing: "Due in 25 days",
    invoice: "Uploaded",
  },
  {
    creator: "Sarah Chen",
    amount: "Rp 8.5M",
    status: "Overdue" as const,
    timing: "3 days late",
    invoice: "Missing",
  },
  {
    creator: "Marcus Lee",
    amount: "Rp 6M",
    status: "Paid" as const,
    timing: "Completed",
    invoice: "Uploaded",
  },
  {
    creator: "Ava Rivera",
    amount: "Rp 9.2M",
    status: "Pending" as const,
    timing: "Due in 18 days",
    invoice: "Uploaded",
  },
];

const statusColors = {
  Pending: "text-amber-400",
  Paid: "text-slate-400",
  Overdue: "text-red-400",
};

export function PayoutIntelligenceSection() {
  return (
    <div className="landing-card-hover overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              Payouts & creator payments, fully tracked.
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Invoices · due dates · payment status — calculated automatically
            </p>
          </div>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] text-violet-300">
            Due in 25 days · next payout
          </span>
        </div>
      </div>

      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4">Creator</th>
              <th className="pb-3 pr-4 text-right">Amount</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Timing</th>
              <th className="pb-3">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {payoutRows.map((row) => (
              <tr
                key={row.creator}
                className="border-b border-white/[0.04] last:border-0"
              >
                <td className="py-3 pr-4 text-sm font-medium text-white">
                  {row.creator}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-sm tabular-nums text-slate-200">
                  {row.amount}
                </td>
                <td className="py-3 pr-4">
                  <span className={cn("text-xs font-medium", statusColors[row.status])}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs text-slate-400">{row.timing}</td>
                <td className="py-3">
                  <span
                    className={cn(
                      "text-xs",
                      row.invoice === "Uploaded"
                        ? "text-emerald-400"
                        : "text-slate-500",
                    )}
                  >
                    {row.invoice}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PositioningStrip() {
  return (
    <p className="text-center text-sm text-slate-500">
      Creator Intelligence OS for KOL specialists, agencies, and brand teams.
    </p>
  );
}
