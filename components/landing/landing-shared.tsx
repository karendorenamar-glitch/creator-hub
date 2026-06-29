"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const LANDING_BG = "#ffffff";
export const LANDING_SURFACE =
  "rounded-3xl border border-violet-100/90 bg-white/90 shadow-[0_16px_48px_-28px_rgba(168,85,247,0.22)] backdrop-blur-sm";
export const LANDING_SURFACE_SUBTLE =
  "rounded-2xl border border-violet-100/80 bg-white/95 backdrop-blur-sm";
export const KEFOO_BUTTON_GRADIENT =
  "bg-gradient-to-r from-[#f0abfc] via-[#d8b4fe] to-[#a855f7]";
export const KEFOO_TEXT_GRADIENT =
  "bg-gradient-to-r from-[#e879f9] via-[#c084fc] to-[#9333ea] bg-clip-text text-transparent";
export const SECTION_CLASS = "py-28";
export const CONTAINER_CLASS =
  "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-12";

const SCHEDULE_DEMO_SUBJECT = "Schedule a Demo";
const SCHEDULE_DEMO_BODY =
  "Hi ! I would like to see your demo, can we schedule a meeting?";

export const SCHEDULE_DEMO_MAILTO = `mailto:hello@kefoo.tech?subject=${encodeURIComponent(SCHEDULE_DEMO_SUBJECT)}&body=${encodeURIComponent(SCHEDULE_DEMO_BODY)}`;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export function LandingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#fdfaff]">
      <div className="landing-dot-grid absolute inset-0 opacity-70" />
      <div className="absolute -left-32 top-20 h-[30rem] w-[30rem] rounded-full bg-[#e9d5ff]/55 blur-3xl" />
      <div className="absolute -right-24 top-[34%] h-96 w-96 rounded-full bg-[#f0abfc]/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#f3e8ff]/70 blur-3xl" />
      <div className="absolute right-1/4 top-[12%] h-40 w-40 rounded-full bg-[#fbcfe8]/25 blur-2xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/90 to-transparent" />
    </div>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUpVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  frame = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  frame?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.25 } } : undefined}
      className={cn(
        LANDING_SURFACE,
        "transition-shadow duration-300",
        frame && "landing-card-frame",
        hover && "hover:shadow-[0_12px_48px_-20px_rgba(15,23,42,0.1)]",
        glow && "shadow-[0_12px_48px_-16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function AppWindowChrome({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mb-5 flex items-center gap-2 border-b border-slate-200/70 pb-4",
        className,
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      <span className="h-2.5 w-2.5 rounded-full bg-slate-200/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-kefoo-500/20" />
      <div className="ml-2 h-6 flex-1 rounded-lg border border-slate-200/70 bg-slate-50/80" />
    </div>
  );
}

export function GradientButton({
  href,
  children,
  className,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const classNames = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium text-white transition-all duration-200 hover:-translate-y-0.5",
    KEFOO_BUTTON_GRADIENT,
    size === "lg"
      ? "px-8 py-4 text-base shadow-[0_12px_36px_-12px_rgba(168,85,247,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(168,85,247,0.52)]"
      : "px-5 py-2.5 text-sm shadow-[0_10px_28px_-12px_rgba(168,85,247,0.4)] hover:shadow-[0_14px_32px_-10px_rgba(168,85,247,0.48)]",
    className,
  );

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      {href.startsWith("mailto:") || href.startsWith("http") ? (
        <a href={href} className={classNames}>
          {children}
        </a>
      ) : (
        <Link href={href} className={classNames}>
          {children}
        </Link>
      )}
    </motion.div>
  );
}

export function GradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(KEFOO_TEXT_GRADIENT, className)}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto mb-16 max-w-3xl text-center", className)}>
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className="hidden h-px w-12 bg-gradient-to-r from-transparent to-violet-200 sm:block" />
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-kefoo-600">
          ✨
        </span>
        <span className="hidden h-px w-12 bg-gradient-to-l from-transparent to-violet-200 sm:block" />
      </div>
      <h2 className="font-heading text-3xl font-bold tracking-tight text-kefoo-800 sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}