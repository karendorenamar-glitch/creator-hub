import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-petal-100 bg-white/95 p-6 shadow-[0_24px_60px_-45px_rgba(207,131,113,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blush",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "blush" | "champagne" | "neutral";
}) {
  const toneStyles = {
    blush: "bg-petal-100 text-petal-500",
    champagne: "bg-sand-100 text-clay-500",
    neutral: "bg-white text-ink-soft",
  }[tone];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
          {label}
        </p>
        {icon ? (
          <span className={cn("rounded-full p-2", toneStyles)}>{icon}</span>
        ) : null}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
        {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
      </div>
    </Card>
  );
}

export function Progress({ value }: { value: number }) {
  const safe = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-petal-100"
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-petal-300 via-olive-300 to-olive-500 transition-[width] duration-500"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "muted";
}) {
  const tones = {
    neutral: "bg-olive-50 text-olive-700 border-olive-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    muted: "bg-stone-50 text-stone-500 border-stone-200",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-olive-200 bg-olive-50/50 px-6 py-12 text-center">
      {icon ? <span className="text-olive-400">{icon}</span> : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
