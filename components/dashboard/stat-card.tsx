import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "indigo" | "violet" | "emerald" | "amber";
};

const accentStyles = {
  indigo: "bg-kefoo-50 text-kefoo-600",
  violet: "bg-kefoo-100 text-kefoo-700",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "indigo",
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            accentStyles[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
