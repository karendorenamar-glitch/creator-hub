"use client";

import { type ComponentType } from "react";
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
  Approved: "bg-kefoo-500/10 text-kefoo-300 border-kefoo-500/20",
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

function BulkUploadVisual() {
  const sampleLinks = [
    "https://www.tiktok.com/@karendorena/video/1234567890",
    "https://www.tiktok.com/@alyaputri/video/9876543210",
    "https://www.tiktok.com/@bimaaditya/video/5555555555",
  ];

  return (
    <div className="mt-5 flex flex-1 flex-col gap-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Campaign
        </p>
        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <span className="text-[11px] font-medium text-slate-200">Twin Date 6:6</span>
          <span className="text-[10px] text-slate-500">▾</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Platform
        </p>
        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <span className="text-[11px] font-medium text-slate-200">TikTok</span>
          <span className="text-[10px] text-slate-500">▾</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          TikTok Video Links
        </p>
        <div className="mt-2 min-h-[132px] rounded-lg border border-white/[0.08] bg-[#070b18] p-3 font-mono text-[9px] leading-relaxed text-slate-400">
          {sampleLinks.map((link) => (
            <p key={link} className="truncate">
              {link}
            </p>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-violet-500/40 bg-violet-500/20 text-[8px] text-violet-200">
              ✓
            </span>
            Import metrics from TikTok
          </label>
          <span className="text-[10px] text-slate-500">3 valid links</span>
        </div>
      </div>

      <div className="rounded-lg border border-kefoo-500/20 bg-kefoo-500/10 px-3 py-2 text-[10px] text-kefoo-200">
        Uploading 2 of 3...
      </div>

      <button
        type="button"
        className="landing-btn-gradient w-full rounded-xl px-4 py-2.5 text-[11px] font-medium text-white"
      >
        Upload 3 Videos
      </button>
    </div>
  );
}

export function ContentPlannerVisual() {
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kefoo-500/30 to-violet-500/30 text-[9px] font-semibold text-white">
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
              <stop offset="100%" stopColor="#6EA5F7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6EA5F7" />
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

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className={CONTAINER_CLASS}>
        <div className="grid gap-6 lg:grid-cols-2">
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
              <h3 className="text-lg font-semibold text-white">Bulk Upload Videos</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Paste TikTok links, pick a campaign, and auto-create creators from @usernames.
              </p>
              <BulkUploadVisual />
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
