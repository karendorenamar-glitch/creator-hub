"use client";

import { useState } from "react";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
} from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";

function MiniCalendar() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = Array.from({ length: 28 }, (_, i) => i + 1);
  const highlighted = [3, 7, 12, 18, 22, 26];

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-medium text-slate-400">June 2026</span>
        <span>24 posts planned</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-600">
        {days.map((d, i) => (
          <span key={`${d}-${i}`} className="py-1">
            {d}
          </span>
        ))}
        {dates.map((date) => (
          <span
            key={date}
            className={cn(
              "rounded-md py-1",
              highlighted.includes(date)
                ? "bg-gradient-to-br from-blue-500/30 to-violet-500/30 font-medium text-violet-200"
                : "text-slate-500",
            )}
          >
            {date}
          </span>
        ))}
      </div>
    </div>
  );
}

function LineChart() {
  const points = "0,80 40,65 80,72 120,48 160,55 200,30 240,38 280,18";
  const area = `M0,100 L0,80 L40,65 L80,72 L120,48 L160,55 L200,30 L240,38 L280,18 L280,100 Z`;

  return (
    <div className="mt-5">
      <svg viewBox="0 0 280 100" className="h-28 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineGrad)" />
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function MotionBar({ height, delay }: { height: number; delay: number }) {
  return (
    <div
      className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/90 to-blue-400/80 transition-all duration-500"
      style={{ height: `${height}%`, transitionDelay: `${delay}s` }}
    />
  );
}

function BarChart({ mode }: { mode: "month" | "campaign" }) {
  const monthData = [
    { label: "Jan", value: 52 },
    { label: "Feb", value: 61 },
    { label: "Mar", value: 58 },
    { label: "Apr", value: 74 },
    { label: "May", value: 68 },
    { label: "Jun", value: 88 },
  ];
  const campaignData = [
    { label: "Launch", value: 82 },
    { label: "Refresh", value: 64 },
    { label: "Teaser", value: 71 },
    { label: "Collab", value: 55 },
  ];
  const data = mode === "month" ? monthData : campaignData;

  return (
    <div className="mt-5 flex h-32 items-end gap-2">
      {data.map((bar, i) => (
        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
          <MotionBar height={bar.value} delay={i * 0.05} />
          <span className="text-[9px] text-slate-500">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
function CompareCampaignsChart() {
  const [mode, setMode] = useState<"month" | "campaign">("month");

  return (
    <div className="mt-5">
      <div className="flex gap-2">
        {(["month", "campaign"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors",
              mode === key
                ? "bg-violet-500/20 text-violet-200"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {key === "month" ? "By Month" : "By Campaign"}
          </button>
        ))}
      </div>
      <BarChart mode={mode} />
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className={CONTAINER_CLASS}>
        <div className="grid gap-6 lg:grid-cols-3">
          <FadeIn delay={0.05}>
            <GlassCard className="flex h-full flex-col p-6">
              <h3 className="text-lg font-semibold text-white">Content Plan Calendar</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Plan, organize, and schedule content across campaigns.
              </p>
              <MiniCalendar />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlassCard className="flex h-full flex-col p-6">
              <h3 className="text-lg font-semibold text-white">
                Campaign Analytics Overview
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Track key metrics across all your campaigns.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Avg ER", value: "10.8%" },
                  { label: "Avg CPV", value: "Rp 4.21" },
                  { label: "Total Views", value: "1.2M" },
                  { label: "Top Creator", value: "Karen Dorena" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <p className="text-[10px] text-slate-500">{stat.label}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <LineChart />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.15}>
            <GlassCard className="flex h-full flex-col p-6">
              <h3 className="text-lg font-semibold text-white">Compare Campaigns</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                See performance comparison across months.
              </p>
              <CompareCampaignsChart />
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
