"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const LANDING_BG = "#050816";
export const SECTION_CLASS = "py-28";
export const CONTAINER_CLASS = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

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
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: LANDING_BG }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.22), transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 -left-32 h-[380px] w-[380px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)" }}
      />
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
        "rounded-[24px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_0_60px_-20px_rgba(168,85,247,0.25)]",
        hover && "transition-shadow duration-300 hover:shadow-[0_0_80px_-16px_rgba(168,85,247,0.4)]",
        glow && "shadow-[0_0_80px_-12px_rgba(129,140,248,0.45)]",
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
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-medium text-white transition-shadow",
          "bg-gradient-to-r from-[#3B82F6] to-[#A855F7]",
          size === "lg"
            ? "px-8 py-4 text-base shadow-[0_0_48px_-8px_rgba(168,85,247,0.65)] hover:shadow-[0_0_64px_-6px_rgba(168,85,247,0.75)]"
            : "px-5 py-2.5 text-sm shadow-[0_8px_32px_-8px_rgba(99,102,241,0.55)] hover:shadow-[0_12px_40px_-8px_rgba(129,140,248,0.6)]",
          className,
        )}
      >
        {children}
      </Link>
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
      className={cn(
        "bg-gradient-to-r from-[#3B82F6] to-[#A855F7] bg-clip-text text-transparent",
        className,
      )}
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
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
