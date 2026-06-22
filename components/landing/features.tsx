"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  analyticsCreatorAvatars,
  CreatorAvatarGraphic,
  KarenAvatar,
} from "@/components/landing/creator-avatars";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
} from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";

const statusStyles = {
  Planned: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "In Review": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Approved: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Published: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
} as const;

const scheduledPosts = [
  {
    creator: "Karen Dorena",
    initials: "KD",
    title: "GRWM Date Night",
    date: "Jun 12",
    status: "Approved" as const,
  },
  {
    creator: "Alya Putri",
    initials: "AP",
    title: "Product Review",
    date: "Jun 14",
    status: "In Review" as const,
  },
  {
    creator: "Bima Aditya",
    initials: "BA",
    title: "Campaign Teaser",
    date: "Jun 18",
    status: "Planned" as const,
  },
  {
    creator: "Rizky Arif",
    initials: "RA",
    title: "Behind The Scene",
    date: "Jun 22",
    status: "Published" as const,
  },
];

function ContentPlannerVisual() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = Array.from({ length: 28 }, (_, i) => i + 1);
  const highlighted = [3, 7, 12, 14, 18, 22, 26];

  return (
    <div className="mt-5 flex flex-1 flex-col gap-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-300">June 2026</span>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
            24 posts planned
          </span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-slate-600">
          {days.map((d, i) => (
            <span key={`${d}-${i}`} className="py-0.5">
              {d}
            </span>
          ))}
          {dates.map((date) => (
            <span
              key={date}
              className={cn(
                "rounded py-0.5",
                highlighted.includes(date)
                  ? "bg-violet-500/25 font-medium text-violet-200"
                  : "text-slate-500",
              )}
            >
              {date}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {scheduledPosts.map((post) => (
          <div
            key={`${post.creator}-${post.date}`}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-2"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-[9px] font-semibold text-white">
              {post.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-slate-200">{post.title}</p>
              <p className="text-[9px] text-slate-500">
                {post.creator} · {post.date}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-medium",
                statusStyles[post.status],
              )}
            >
              {post.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {(Object.keys(statusStyles) as Array<keyof typeof statusStyles>).map((status) => (
          <span
            key={status}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[8px] font-medium",
              statusStyles[status],
            )}
          >
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
  className,
  avatar,
  stackedAvatars,
}: {
  label: string;
  value: string;
  className?: string;
  avatar?: ComponentType<{ className?: string }>;
  stackedAvatars?: ComponentType<{ className?: string }>[];
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {stackedAvatars ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {stackedAvatars.map((Avatar, index) => (
              <CreatorAvatarGraphic
                key={analyticsCreatorAvatars[index]?.name ?? index}
                Avatar={Avatar}
                className="h-7 w-7"
              />
            ))}
          </div>
          <p className="text-sm font-semibold tracking-tight text-white">{value}</p>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2.5">
          {avatar ? (
            <CreatorAvatarGraphic Avatar={avatar} className="h-9 w-9" />
          ) : null}
          <p className="text-sm font-semibold tracking-tight text-white">{value}</p>
        </div>
      )}
    </div>
  );
}

function CampaignAnalyticsVisual() {
  const chartPoints = "0,72 35,58 70,64 105,42 140,48 175,32 210,38 245,22 280,28";

  return (
    <div className="mt-5 flex flex-1 flex-col">
      <div className="grid grid-cols-3 gap-2">
        <AnalyticsMetric label="Avg ER" value="10.8%" />
        <AnalyticsMetric label="Avg CPV" value="Rp 4.21" />
        <AnalyticsMetric label="Avg CPE" value="Rp 212" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <AnalyticsMetric
          label="Top Creator"
          value="Karen Dorena"
          avatar={KarenAvatar}
        />
        <AnalyticsMetric
          label="All Creators"
          value={`${analyticsCreatorAvatars.length} active`}
          stackedAvatars={analyticsCreatorAvatars.map((creator) => creator.Avatar)}
        />
        <AnalyticsMetric
          label="Most Valuable Content"
          value={`"GRWM Date Night"`}
          className="col-span-2"
        />
      </div>

      <div className="mt-4 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-500">Performance trend</span>
          <span className="text-[10px] text-emerald-400/90">+18.4%</span>
        </div>
        <svg viewBox="0 0 280 80" className="h-24 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <path
            d={`M0,80 L0,72 L35,58 L70,64 L105,42 L140,48 L175,32 L210,38 L245,22 L280,28 L280,80 Z`}
            fill="url(#analyticsArea)"
          />
          <polyline
            points={chartPoints}
            fill="none"
            stroke="url(#analyticsLine)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

const monthlyCampaignLines = [
  {
    name: "Twin Date",
    color: "#A855F7",
    points: "0,68 40,52 80,58 120,38 160,44 200,28 240,34 280,18",
  },
  {
    name: "Monthly Product",
    color: "#3B82F6",
    points: "0,75 40,62 80,55 120,48 160,52 200,40 240,46 280,32",
  },
  {
    name: "Holiday",
    color: "#6366F1",
    points: "0,82 40,70 80,72 120,58 160,60 200,50 240,55 280,42",
  },
];

const campaignBars = [
  { name: "Twin Date 6:6", views: 88, er: 72, cpv: 65 },
  { name: "Twin Date 7:7", views: 74, er: 58, cpv: 82 },
  { name: "Twin Date 8:8", views: 62, er: 84, cpv: 54 },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const barCampaignColors = ["#A855F7", "#3B82F6", "#6366F1"];

function CampaignFilterPills({
  options,
  selectedCampaign,
  onSelect,
}: {
  options: { name: string; color: string }[];
  selectedCampaign: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "rounded-full border px-2.5 py-1 text-[9px] font-medium transition-all",
          selectedCampaign === "all"
            ? "border-white/20 bg-white/[0.08] text-white"
            : "border-white/[0.06] bg-transparent text-slate-500 hover:border-white/10 hover:text-slate-300",
        )}
      >
        All Campaigns
      </button>
      {options.map((option) => (
        <button
          key={option.name}
          type="button"
          onClick={() => onSelect(option.name)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-medium transition-all",
            selectedCampaign === option.name
              ? "border-white/20 bg-white/[0.08] text-white"
              : "border-white/[0.06] bg-transparent text-slate-500 hover:border-white/10 hover:text-slate-300",
          )}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: option.color }}
          />
          {option.name}
        </button>
      ))}
    </div>
  );
}

function CompareCampaignBarChart({
  selectedCampaign,
  onSelectCampaign,
}: {
  selectedCampaign: string;
  onSelectCampaign: (value: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const visibleCampaigns = useMemo(
    () =>
      selectedCampaign === "all"
        ? campaignBars
        : campaignBars.filter((campaign) => campaign.name === selectedCampaign),
    [selectedCampaign],
  );
  const metrics = [
    { key: "views", label: "Views", color: "#A855F7" },
    { key: "er", label: "ER", color: "#3B82F6" },
    { key: "cpv", label: "CPV", color: "#818CF8" },
  ] as const;

  const chartW = 280;
  const chartH = 120;
  const pad = { top: 8, right: 8, bottom: 22, left: 8 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;
  const groupW = plotW / Math.max(visibleCampaigns.length, 1);
  const barW = groupW / metrics.length - 4;
  const barFilterOptions = campaignBars.map((campaign, index) => ({
    name: campaign.name,
    color: barCampaignColors[index % barCampaignColors.length],
  }));

  return (
    <div className="mt-3 flex flex-1 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <CampaignFilterPills
        options={barFilterOptions}
        selectedCampaign={selectedCampaign}
        onSelect={onSelectCampaign}
      />

      <div className="mb-2 flex flex-wrap gap-3">
        {metrics.map((metric) => (
          <span key={metric.key} className="flex items-center gap-1.5 text-[9px] text-slate-500">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: metric.color, opacity: 0.85 }}
            />
            {metric.label === "ER" ? "Engagement Rate" : metric.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="min-h-[150px] w-full flex-1">
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pad.top + plotH * (1 - tick);
          return (
            <line
              key={tick}
              x1={pad.left}
              y1={y}
              x2={chartW - pad.right}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}

        {visibleCampaigns.map((campaign, groupIndex) => {
          const groupX = pad.left + groupIndex * groupW + groupW / 2;

          return (
            <g key={campaign.name}>
              {metrics.map((metric, barIndex) => {
                const value = campaign[metric.key];
                const barHeight = (value / 100) * plotH;
                const x =
                  pad.left +
                  groupIndex * groupW +
                  barIndex * (barW + 3) +
                  (groupW - metrics.length * barW - (metrics.length - 1) * 3) / 2;
                const y = pad.top + plotH - barHeight;
                const id = `${campaign.name}-${metric.key}`;

                return (
                  <rect
                    key={id}
                    x={x}
                    y={y}
                    width={barW}
                    height={barHeight}
                    rx={3}
                    fill={metric.color}
                    opacity={
                      hovered && hovered !== id ? 0.35 : hovered === id ? 1 : 0.78
                    }
                    className="transition-opacity duration-200"
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
              <text
                x={groupX}
                y={chartH - 4}
                textAnchor="middle"
                className="fill-slate-500 text-[8px]"
              >
                {campaign.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CompareCampaignLineChart({
  selectedCampaign,
  onSelectCampaign,
}: {
  selectedCampaign: string;
  onSelectCampaign: (value: string) => void;
}) {
  const chartW = 280;
  const chartH = 130;
  const pad = { top: 10, right: 10, bottom: 24, left: 10 };
  const lineFilterOptions = monthlyCampaignLines.map((line) => ({
    name: line.name,
    color: line.color,
  }));
  const visibleLines = useMemo(
    () =>
      selectedCampaign === "all"
        ? monthlyCampaignLines
        : monthlyCampaignLines.filter((line) => line.name === selectedCampaign),
    [selectedCampaign],
  );

  return (
    <div className="mt-3 flex flex-1 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <CampaignFilterPills
        options={lineFilterOptions}
        selectedCampaign={selectedCampaign}
        onSelect={onSelectCampaign}
      />

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="min-h-[150px] w-full flex-1">
        {[0.25, 0.5, 0.75].map((tick) => {
          const y = pad.top + (chartH - pad.top - pad.bottom) * tick;
          return (
            <line
              key={tick}
              x1={pad.left}
              y1={y}
              x2={chartW - pad.right}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}

        {visibleLines.map((line) => (
          <g key={line.name}>
            <polyline
              points={line.points}
              fill="none"
              stroke={line.color}
              strokeWidth={selectedCampaign === "all" ? 1.75 : 2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
            {line.points.split(" ").map((point, i) => {
              const [x, y] = point.split(",").map(Number);
              if (Number.isNaN(x) || Number.isNaN(y)) return null;
              return (
                <circle
                  key={`${line.name}-${i}`}
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill={line.color}
                  opacity={0.95}
                />
              );
            })}
          </g>
        ))}

        {monthLabels.map((label, i) => {
          const x = pad.left + (i / (monthLabels.length - 1)) * (chartW - pad.left - pad.right);
          return (
            <text
              key={label}
              x={x}
              y={chartH - 6}
              textAnchor="middle"
              className="fill-slate-500 text-[8px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function CompareCampaignsVisual() {
  const [mode, setMode] = useState<"month" | "campaign">("campaign");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  function handleModeChange(nextMode: "month" | "campaign") {
    setMode(nextMode);
    setSelectedCampaign("all");
  }

  return (
    <div className="mt-5 flex flex-1 flex-col">
      <div className="flex gap-2">
        {(["month", "campaign"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleModeChange(key)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all",
              mode === key
                ? "border-violet-500/25 bg-violet-500/10 text-violet-200"
                : "border-transparent text-slate-500 hover:border-white/10 hover:text-slate-300",
            )}
          >
            {key === "month" ? "By Month" : "By Campaign"}
          </button>
        ))}
      </div>

      {mode === "month" ? (
        <CompareCampaignLineChart
          selectedCampaign={selectedCampaign}
          onSelectCampaign={setSelectedCampaign}
        />
      ) : (
        <CompareCampaignBarChart
          selectedCampaign={selectedCampaign}
          onSelectCampaign={setSelectedCampaign}
        />
      )}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className={CONTAINER_CLASS}>
        <div className="grid gap-6 lg:grid-cols-3">
          <FadeIn delay={0.05}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6">
              <h3 className="text-lg font-semibold text-white">Campaign Analytics Overview</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Track campaign performance across all creators in real time.
              </p>
              <CampaignAnalyticsVisual />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6">
              <h3 className="text-lg font-semibold text-white">Compare Campaigns</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Analyze campaign performance side-by-side and identify top performers.
              </p>
              <CompareCampaignsVisual />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.15}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6">
              <h3 className="text-lg font-semibold text-white">Content Planner</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Plan, organize, and manage creator deliverables across campaigns.
              </p>
              <ContentPlannerVisual />
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
