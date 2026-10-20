"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_CANDIDATES = [
  "/brand/logo-wedding-planner.jpg",
  "/brand/logo-wedding-planner.jpeg",
  "/brand/logo-wedding-planner.png",
  "/brand/kefoo-wedding-planner.jpg",
];

/**
 * Brand mark used in the sidebar, login screen and onboarding.
 * Tries the uploaded logo files in order and falls back to the previous
 * icon + wordmark if none exist, so a missing file never shows a broken image.
 */
export function BrandLogo({
  size = "sm",
  className,
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const height = size === "lg" ? "h-16" : "h-10";

  if (!failed) {
    return (
      <img
        src={LOGO_CANDIDATES[attempt]}
        alt="Kefoo Wedding Planner"
        onError={() => {
          if (attempt + 1 < LOGO_CANDIDATES.length) {
            setAttempt(attempt + 1);
          } else {
            setFailed(true);
          }
        }}
        className={cn(height, "w-auto max-w-[220px] object-contain", className)}
      />
    );
  }

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-olive-100 text-olive-700">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-base font-semibold text-ink">
          Kefoo
        </span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-clay-500">
          Wedding Planner
        </span>
      </span>
    </span>
  );
}
