import type { PayoutTimingBadge as PayoutTimingBadgeVariant } from "@/lib/payouts";
import { cn } from "@/lib/utils";

const badgeStyles: Record<PayoutTimingBadgeVariant, string> = {
  on_time: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  due_today: "bg-amber-50 text-amber-700 ring-amber-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
  paid: "bg-slate-100 text-slate-600 ring-slate-200",
};

type PayoutTimingBadgeProps = {
  badge: PayoutTimingBadgeVariant | null;
  timingLabel: string;
};

export function PayoutTimingBadge({
  badge,
  timingLabel,
}: PayoutTimingBadgeProps) {
  if (timingLabel === "-") {
    return <span className="text-sm text-slate-400">-</span>;
  }

  if (!badge) {
    return <span className="text-sm text-slate-600">{timingLabel}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-[220px] items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-snug ring-1 ring-inset",
        badgeStyles[badge],
      )}
    >
      {timingLabel}
    </span>
  );
}
