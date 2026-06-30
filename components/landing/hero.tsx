"use client";

import { ArrowRight, Sparkles, Zap, BarChart3, Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AppWindowChrome,
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  GradientButton,
  GradientText,
  FREE_TRIAL_SIGNUP_HREF,
  SIGN_IN_HREF,
  fadeUpVariants,
} from "@/components/landing/landing-shared";
import Link from "next/link";
import { CreatorAvatarGraphic, KarenAvatar } from "@/components/landing/creator-avatars";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Zap,
    title: "Sign up in minutes",
    subtitle: "No demo call needed",
  },
  {
    icon: Search,
    title: "Search by keywords",
    subtitle: "Creators + hashtags",
  },
  {
    icon: BarChart3,
    title: "Live metrics",
    subtitle: "Paste links, track CPV & ER",
  },
];

const primaryMetrics = [
  { label: "Views", value: "77.6K" },
  { label: "Likes", value: "12.3K" },
  { label: "Saves", value: "1,110" },
  { label: "Comments", value: "1,245" },
];

const secondaryMetrics = [
  { label: "Engagement Rate", value: "11.4%", note: "Above average" },
  { label: "CPV", value: "Rp 3.87", note: "Low cost" },
  { label: "Saves Rate", value: "1.43%", note: "High intent" },
  { label: "Performance", value: "Excellent", note: "Top performer" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-32 pb-28 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-40" />

      <div className={CONTAINER_CLASS}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative mx-auto w-full max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <FadeIn>
              <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-violet-100 bg-violet-50/95 px-3.5 py-1.5 text-xs font-medium text-kefoo-600 shadow-sm lg:justify-start">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Self-serve</span>
                <span className="text-violet-300" aria-hidden>
                  ·
                </span>
                <span>Free trial</span>
                <span className="text-violet-300" aria-hidden>
                  ·
                </span>
                <span>No card needed</span>
              </span>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.08] tracking-tight text-kefoo-800 sm:text-5xl lg:text-[3.25rem]">
                Run KOL campaigns effortlessly, with{" "}
                <GradientText>live data</GradientText>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base lg:mx-0">
                Search campaign videos by keyword, paste TikTok & Instagram
                links, and track creator performance — self-serve, no sales
                call.
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <GradientButton
                  href={FREE_TRIAL_SIGNUP_HREF}
                  size="lg"
                  className="px-8"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </GradientButton>
                <Link
                  href={SIGN_IN_HREF}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-kefoo-600"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {benefits.map((item) => (
                  <div
                    key={item.title}
                    className="min-w-0 rounded-2xl border border-violet-100/90 bg-white/85 px-4 py-3.5 text-left shadow-[0_12px_32px_-24px_rgba(168,85,247,0.22)] backdrop-blur-sm"
                  >
                    <div className="inline-flex rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-100/70 p-2">
                      <item.icon className="h-4 w-4 text-kefoo-500" />
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-slate-500">
                      {item.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/40" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/25" />

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-full"
            >
              <GlassCard glow hover={false} className="relative overflow-hidden p-6 sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,74,74,0.08)_0%,transparent_68%)]" />

                <div className="relative">
                <AppWindowChrome />
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-kefoo-400" />
                  <span className="text-xs font-medium text-kefoo-400">
                    Insight ready
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-600">Metrics synced from link</span>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  <CreatorAvatarGraphic Avatar={KarenAvatar} className="h-11 w-11" />
                  <div>
                    <p className="font-semibold text-slate-900">Karen Dorena</p>
                    <p className="text-sm text-slate-500">@karendorena</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {primaryMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-3"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {metric.label}
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {secondaryMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className={cn(
                        "rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-3",
                        metric.label === "Performance" &&
                          "border-kefoo-500/20 bg-kefoo-500/[0.06]",
                      )}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {metric.value}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{metric.note}</p>
                    </div>
                  ))}
                </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}