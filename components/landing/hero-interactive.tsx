"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_URL = "https://www.tiktok.com/@karendorena/video/123456";
const ANALYSIS_DELAY_MS = 850;

const DEMO_CREATOR = "Karen Dorena";

const featurePills = [
  "Automatic data extraction",
  "Real-time performance metrics",
  "Campaign-ready insights",
];

const demoMetrics = [
  { label: "Views", value: "1.4M" },
  { label: "Likes", value: "92K" },
  { label: "Saves", value: "8.1K" },
  { label: "Comments", value: "4.1K" },
];

const intelligenceMetrics = [
  { label: "Performance Score", value: "96" },
  { label: "Efficiency Score", value: "94" },
  { label: "Cost per view (CPV)", value: "Rp 39" },
  { label: "Engagement strength", value: "High" },
];

type AnalysisPhase = "idle" | "loading" | "done";

function isVideoUrl(value: string) {
  return /tiktok\.com|instagram\.com|youtube\.com|youtu\.be/i.test(value.trim());
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-kefoo-500/10 via-kefoo-400/15 to-kefoo-500/10",
        className,
      )}
    />
  );
}

function ResultCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 backdrop-blur-sm transition-all duration-300",
        glow && "shadow-[0_0_36px_-14px_rgba(110,165,247,0.4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex min-h-[400px] flex-col">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kefoo-400/30" />
          <span className="relative h-2 w-2 rounded-full bg-kefoo-400/70" />
        </span>
        <span className="text-xs text-slate-600">Intelligence engine ready</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Paste a link to see creator intelligence appear here
      </p>
      <div className="mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white/85 p-4">
        {["Views", "Likes", "Performance", "CPV"].map((label) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-20 text-xs text-slate-500">{label}</span>
            <Shimmer className="h-2 flex-1" />
          </div>
        ))}
      </div>
      <p className="mt-auto pt-5 text-xs text-slate-600">
        Auto-generated once a creator link is detected
      </p>
    </div>
  );
}

export function HeroInteractiveDemo() {
  const [videoUrl, setVideoUrl] = useState("");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnalysisTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runAnalysis = useCallback(
    (url?: string) => {
      clearAnalysisTimeout();
      if (!videoUrl.trim() && !url?.trim()) setVideoUrl(EXAMPLE_URL);
      setPhase("loading");
      timeoutRef.current = setTimeout(() => {
        setPhase("done");
        timeoutRef.current = null;
      }, ANALYSIS_DELAY_MS);
    },
    [clearAnalysisTimeout, videoUrl],
  );

  useEffect(() => {
    return () => {
      clearAnalysisTimeout();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [clearAnalysisTimeout]);

  function handleInputChange(value: string) {
    setVideoUrl(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isVideoUrl(value)) {
      debounceRef.current = setTimeout(() => runAnalysis(value), 300);
    } else if (phase === "done") {
      setPhase("idle");
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (isVideoUrl(pasted)) setTimeout(() => runAnalysis(pasted), 40);
  }

  return (
    <div id="hero-demo" className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div>
        <label htmlFor="hero-video-input" className="sr-only">
          Paste a TikTok or Instagram link
        </label>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_8px_40px_-16px_rgba(74,134,232,0.3)] backdrop-blur-sm transition-all focus-within:border-kefoo-400/25 focus-within:shadow-[0_8px_48px_-12px_rgba(110,165,247,0.35)]">
          <input
            id="hero-video-input"
            type="url"
            value={videoUrl}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste TikTok or Instagram link"
            className="w-full bg-transparent px-5 py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => runAnalysis()}
          disabled={phase === "loading"}
          className="landing-btn-gradient mt-4 w-full sm:w-auto"
        >
          {phase === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze instantly
            </>
          )}
        </button>
        <div className="mt-5 flex flex-wrap gap-2">
          {featurePills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[11px] text-slate-600"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-card-hover relative min-h-[420px] overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-kefoo-500/[0.07] via-transparent to-kefoo-500/[0.06] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-kefoo-500/10 blur-3xl" />

        {phase === "idle" && <EmptyPreview />}

        {phase === "loading" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-kefoo-300" />
              Extracting creator intelligence…
            </div>
            <Shimmer className="h-12" />
            <div className="grid grid-cols-2 gap-2">
              <Shimmer className="h-14" />
              <Shimmer className="h-14" />
              <Shimmer className="h-14" />
              <Shimmer className="h-14" />
            </div>
            <Shimmer className="h-28" />
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-3">
            <ResultCard glow className="matrix-reveal border-kefoo-400/20">
              <p className="text-xs text-slate-600">
                Creator detected:{" "}
                <span className="font-medium text-slate-900">{DEMO_CREATOR}</span>
              </p>
            </ResultCard>

            <ResultCard className="matrix-reveal matrix-reveal-delay-1">
              <p className="mb-3 text-xs font-medium text-slate-500">
                Video performance
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoMetrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl bg-white px-3 py-2.5"
                  >
                    <p className="text-[10px] text-slate-500">{m.label}</p>
                    <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-slate-900">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </ResultCard>

            <ResultCard
              glow
              className="matrix-reveal matrix-reveal-delay-2 border-kefoo-400/15 bg-gradient-to-br from-kefoo-500/[0.08] to-kefoo-500/[0.05]"
            >
              <p className="mb-3 text-xs font-medium text-kefoo-200/90">
                Intelligence
              </p>
              <div className="space-y-2">
                {intelligenceMetrics.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                  >
                    <span className="text-[11px] text-slate-600">
                      {item.label}
                    </span>
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </ResultCard>
          </div>
        )}
      </div>
    </div>
  );
}