"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { Loader2, Search, Sparkles } from "lucide-react";
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

function KeywordDiscoverVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: false, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "scanning" | "results">("idle");
  const [visibleMatches, setVisibleMatches] = useState(0);

  const creators = ["@karendorena", "@alyaputri", "@bimaaditya"];
  const keywords = ["#TwinDate66", "date night"];
  const matches = [
    {
      creator: "Karen Dorena",
      caption: "GRWM for #TwinDate66 ✨",
      saves: "842",
    },
    {
      creator: "Alya Putri",
      caption: "Date night fit check #TwinDate66",
      saves: "611",
    },
    {
      creator: "Bima Aditya",
      caption: "POV: #TwinDate66 makeup look",
      saves: "418",
    },
  ];

  useEffect(() => {
    if (!inView) {
      return;
    }

    if (reduceMotion) {
      setPhase("results");
      setVisibleMatches(matches.length);
      return;
    }

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function schedule(fn: () => void, ms: number) {
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) {
            fn();
          }
        }, ms),
      );
    }

    function runCycle() {
      setPhase("idle");
      setVisibleMatches(0);

      schedule(() => setPhase("scanning"), 600);

      schedule(() => {
        setPhase("results");
        setVisibleMatches(1);
      }, 2000);

      schedule(() => setVisibleMatches(2), 2600);
      schedule(() => setVisibleMatches(3), 3200);
      schedule(() => runCycle(), 7200);
    }

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [inView, reduceMotion, matches.length]);

  const isScanning = phase === "scanning";
  const showResults = phase === "results";
  const matchCount = reduceMotion ? matches.length : visibleMatches;

  return (
    <div ref={containerRef} className="mt-5 flex flex-1 flex-col gap-3">
      <div
        className={cn(
          "rounded-xl border bg-white/85 p-3 transition-colors duration-300",
          isScanning
            ? "border-kefoo-400/40 bg-kefoo-50/50"
            : "border-slate-200/70",
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Creator handles
        </p>
        <div className="relative mt-2 space-y-1 overflow-hidden font-mono text-[9px] text-slate-600">
          {creators.map((handle, index) => (
            <motion.p
              key={handle}
              animate={
                isScanning
                  ? { opacity: [0.55, 1, 0.55], x: [0, 1, 0] }
                  : { opacity: 1, x: 0 }
              }
              transition={{
                duration: 1.1,
                repeat: isScanning ? Infinity : 0,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            >
              {handle}
            </motion.p>
          ))}
          {isScanning ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-kefoo-400/25 to-transparent"
              animate={{ y: [0, 52, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border bg-white/85 p-3 transition-colors duration-300",
          isScanning
            ? "border-kefoo-400/40 shadow-[0_0_24px_-12px_rgba(168,85,247,0.45)]"
            : "border-slate-200/70",
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Campaign keywords
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {keywords.map((keyword, index) => (
            <motion.span
              key={keyword}
              animate={
                isScanning
                  ? { scale: [1, 1.06, 1], boxShadow: ["0 0 0 rgba(168,85,247,0)", "0 0 12px rgba(168,85,247,0.35)", "0 0 0 rgba(168,85,247,0)"] }
                  : { scale: 1 }
              }
              transition={{
                duration: 1.2,
                repeat: isScanning ? Infinity : 0,
                delay: index * 0.25,
              }}
              className="rounded-full border border-kefoo-500/25 bg-kefoo-500/10 px-2 py-0.5 text-[9px] font-medium text-kefoo-700"
            >
              {keyword}
            </motion.span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isScanning ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-kefoo-400/30 bg-gradient-to-r from-kefoo-50/90 to-violet-50/80 px-3 py-2.5"
          >
            <div className="flex items-center gap-2 text-[10px] font-medium text-kefoo-700">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              <span>Scanning 3 creators · 10 recent videos each</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-kefoo-400 to-violet-500"
                initial={{ width: "8%" }}
                animate={{ width: "92%" }}
                transition={{ duration: 1.35, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-1 flex-col rounded-xl border border-slate-200/70 bg-white/85 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Matching videos
          </p>
          <motion.span
            key={matchCount}
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-semibold text-emerald-700"
          >
            {matchCount > 0 ? `${matchCount} found` : "—"}
          </motion.span>
        </div>
        <div className="space-y-2">
          {matches.map((match, index) => (
            <AnimatePresence key={match.creator}>
              {(showResults || reduceMotion) && index < visibleMatches ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-lg border border-emerald-500/15 bg-white/90 px-2.5 py-2 text-left shadow-[0_8px_20px_-16px_rgba(16,185,129,0.55)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-medium text-slate-900">
                      {match.creator}
                    </p>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-emerald-700">
                      Match
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] text-slate-500">
                    {match.caption}
                  </p>
                  <p className="mt-1 text-[9px] font-medium text-kefoo-600">
                    {match.saves} saves
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          ))}
          {!showResults && !reduceMotion && visibleMatches === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200/80 px-2.5 py-6 text-center text-[9px] text-slate-400">
              Matches appear after keyword scan
            </p>
          ) : null}
        </div>
      </div>

      <motion.button
        type="button"
        animate={
          showResults && matchCount > 0
            ? { scale: [1, 1.02, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: 2,
          repeat: showResults && matchCount > 0 ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="landing-btn-gradient w-full rounded-xl px-4 py-2.5 text-[11px] font-medium text-white shadow-[0_10px_28px_-12px_rgba(168,85,247,0.5)]"
      >
        Add to campaign
      </motion.button>
    </div>
  );
}

function DiscoverHighlightCard() {
  return (
    <>
      <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-gradient-to-b from-kefoo-400/20 via-violet-400/10 to-transparent blur-2xl" />
      <GlassCard
        glow
        frame
        hover={false}
        className="relative flex h-full min-h-[520px] flex-col border-kefoo-400/25 p-6 text-center shadow-[0_0_56px_-16px_rgba(168,85,247,0.4)] sm:text-left lg:scale-[1.04]"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-kefoo-400/30 bg-kefoo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-kefoo-700">
            <Sparkles className="h-3 w-3" />
            FAVORITE FEATURE FOR YOU
          </span>
          <span className="font-mono text-[11px] text-kefoo-500/80">02</span>
        </div>
        <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
          <Search className="h-5 w-5 text-kefoo-500" />
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            Discover by keywords
          </h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Drop @handles + campaign hashtags. Kefoo scans recent TikTok posts and
          surfaces matches posted during your campaign dates — no more chasing
          links in DMs.
        </p>
        <KeywordDiscoverVisual />
      </GlassCard>
    </>
  );
}

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
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="relative py-28">
      <div className="landing-section-muted pointer-events-none absolute inset-0 -z-10" />
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="hidden h-px w-12 bg-gradient-to-r from-transparent to-slate-200 sm:block" />
              <span className="h-1.5 w-1.5 rounded-full bg-kefoo-400/60" />
              <span className="hidden h-px w-12 bg-gradient-to-l from-transparent to-slate-200 sm:block" />
            </div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to run campaigns yourself
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Paste links in bulk, track performance live — or skip the chase with{" "}
              <span className="font-medium text-kefoo-700">keyword scan</span> built
              for KOL teams.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <FadeIn delay={0.05}>
            <GlassCard frame className="flex h-full min-h-[480px] flex-col p-6 text-center sm:text-left lg:translate-y-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-slate-400">01</span>
                <span className="h-px flex-1 bg-gradient-to-r from-slate-200/80 to-transparent" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Bulk upload videos</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Paste TikTok links, pick a campaign, and auto-create creators from @usernames.
              </p>
              <BulkUploadVisual />
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:z-10">
            {reduceMotion ? (
              <div className="relative h-full">
                <DiscoverHighlightCard />
              </div>
            ) : (
              <motion.div
                className="relative h-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <DiscoverHighlightCard />
              </motion.div>
            )}
          </FadeIn>

          <FadeIn delay={0.15}>
            <GlassCard frame className="flex h-full min-h-[480px] flex-col p-6 text-center sm:text-left lg:translate-y-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-slate-400">03</span>
                <span className="h-px flex-1 bg-gradient-to-r from-slate-200/80 to-transparent" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Campaign analytics at a glance</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Track views, engagement, and CPV across every creator in real time.
              </p>
              <CampaignAnalyticsVisual />
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}