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

import {
  EXECUTION_TRACKER_STATUS_LABELS,
  EXECUTION_TRACKER_STATUS_SUMMARY,
  type CampaignCreatorWorkflowStatus,
} from "@/lib/campaign-creator-status";

const executionStatusStyles: Record<CampaignCreatorWorkflowStatus, string> = {
  brief_sent: "bg-slate-500/15 text-slate-600 border-slate-500/20",
  waiting_content: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  revision: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  posted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const executionSummaryCounts: Record<CampaignCreatorWorkflowStatus, number> = {
  brief_sent: 2,
  waiting_content: 1,
  revision: 1,
  posted: 2,
};

const executionRows: Array<{
  creator: string;
  initials: string;
  platform: string;
  status: CampaignCreatorWorkflowStatus;
}> = [
  {
    creator: "Karen Dorena",
    initials: "KD",
    platform: "TikTok",
    status: "posted",
  },
  {
    creator: "Alya Putri",
    initials: "AP",
    platform: "Instagram",
    status: "waiting_content",
  },
  {
    creator: "Bima Aditya",
    initials: "BA",
    platform: "TikTok",
    status: "revision",
  },
  {
    creator: "Rizky Arif",
    initials: "RA",
    platform: "TikTok",
    status: "brief_sent",
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
      <div className="rounded-xl border border-slate-200/70 bg-white/85 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Campaign
        </p>
        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2">
          <span className="text-[11px] font-medium text-slate-200">Twin Date 6:6</span>
          <span className="text-[10px] text-slate-500">▾</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/85 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Platform
        </p>
        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2">
          <span className="text-[11px] font-medium text-slate-200">TikTok</span>
          <span className="text-[10px] text-slate-500">▾</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-xl border border-slate-200/70 bg-white/85 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          TikTok Video Links
        </p>
        <div className="mt-2 min-h-[132px] rounded-lg border border-slate-200/80 bg-slate-50 p-3 font-mono text-[9px] leading-relaxed text-slate-600">
          {sampleLinks.map((link) => (
            <p key={link} className="truncate">
              {link}
            </p>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-[10px] text-slate-600">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-kefoo-500/40 bg-kefoo-500/20 text-[8px] text-kefoo-200">
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

export function ExecutionTrackerVisual() {
  return (
    <div className="mt-5 flex flex-1 flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EXECUTION_TRACKER_STATUS_SUMMARY.map(({ status, label }) => (
          <div
            key={status}
            className="rounded-xl border border-slate-200/70 bg-white/85 px-2.5 py-2 text-left"
          >
            <p className="text-[9px] font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {executionSummaryCounts[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200/70 bg-white/85 p-2.5">
        <div className="mb-2 grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-2 border-b border-slate-200/70 pb-2 text-[9px] font-medium uppercase tracking-wide text-slate-500">
          <span>Creator</span>
          <span>Platform</span>
          <span>Status</span>
        </div>
        <div className="space-y-2">
          {executionRows.map((row) => (
            <div
              key={row.creator}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kefoo-500/30 to-kefoo-500/30 text-[9px] font-semibold text-white">
                  {row.initials}
                </div>
                <p className="truncate text-[11px] font-medium text-slate-900">
                  {row.creator}
                </p>
              </div>
              <span className="text-[10px] text-slate-600">{row.platform}</span>
              <span
                className={cn(
                  "inline-flex w-fit rounded-full border px-2 py-0.5 text-[8px] font-medium",
                  executionStatusStyles[row.status],
                )}
              >
                {EXECUTION_TRACKER_STATUS_LABELS[row.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-800">
        Uploaded creators can paste a video link to auto-import metrics.
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
        "rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2.5",
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
          <p className="text-sm font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2.5">
          {avatar ? (
            <CreatorAvatarGraphic Avatar={avatar} className="h-9 w-9" />
          ) : null}
          <p className="text-sm font-semibold tracking-tight text-slate-900">{value}</p>
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

      <div className="mt-4 flex-1 rounded-xl border border-slate-200/70 bg-white/85 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-500">Performance trend</span>
          <span className="text-[10px] text-emerald-400/90">+18.4%</span>
        </div>
        <svg viewBox="0 0 280 80" className="h-24 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6EA5F7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6EA5F7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6EA5F7" />
              <stop offset="100%" stopColor="#3569C7" />
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
        <FadeIn>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to run creator campaigns
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Analytics, bulk uploads, and campaign workflows in one platform.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn delay={0.05}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900">Bulk Upload Videos</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Paste TikTok links, pick a campaign, and auto-create creators from @usernames.
              </p>
              <BulkUploadVisual />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <GlassCard className="flex h-full min-h-[480px] flex-col p-6 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-900">Campaign Analytics Overview</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track campaign performance across all creators in real time.
              </p>
              <CampaignAnalyticsVisual />
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}