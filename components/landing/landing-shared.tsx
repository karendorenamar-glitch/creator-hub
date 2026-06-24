"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const LANDING_BG = "#ffffff";
export const LANDING_SURFACE =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_40px_-24px_rgba(15,23,42,0.08)] backdrop-blur-sm";
export const LANDING_SURFACE_SUBTLE =
  "rounded-xl border border-slate-200/70 bg-white backdrop-blur-sm";
export const KEFOO_BUTTON_GRADIENT =
  "bg-gradient-to-r from-kefoo-200 via-kefoo-300 to-kefoo-400";
export const KEFOO_TEXT_GRADIENT =
  "bg-gradient-to-r from-kefoo-300 via-kefoo-400 to-kefoo-500 bg-clip-text text-transparent";
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
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-white"
      style={{ backgroundColor: LANDING_BG }}
    />
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
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.25 } } : undefined}
      className={cn(
        LANDING_SURFACE,
        "transition-shadow duration-300",
        hover && "hover:shadow-[0_12px_48px_-20px_rgba(15,23,42,0.1)]",
        glow && "shadow-[0_12px_48px_-16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </motion.div>
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
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium text-white transition-shadow",
    KEFOO_BUTTON_GRADIENT,
    size === "lg"
      ? "px-8 py-4 text-base shadow-[0_8px_32px_-10px_rgba(45,103,214,0.35)] hover:shadow-[0_12px_40px_-10px_rgba(45,103,214,0.42)]"
      : "px-5 py-2.5 text-sm shadow-[0_6px_24px_-10px_rgba(45,103,214,0.32)] hover:shadow-[0_10px_32px_-10px_rgba(45,103,214,0.38)]",
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
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
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