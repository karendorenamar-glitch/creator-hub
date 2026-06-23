import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  FEATURE_UPGRADE_MESSAGES,
  getRequiredCheckoutPlan,
  type PlanFeature,
} from "@/lib/plan-features";
import { formatCheckoutPlanLabel } from "@/lib/plan-checkout";

type PlanUpgradePromptProps = {
  feature: PlanFeature;
  title: string;
  description: string;
  className?: string;
};

export function PlanUpgradePrompt({
  feature,
  title,
  description,
  className,
}: PlanUpgradePromptProps) {
  const targetPlan = getRequiredCheckoutPlan(feature);

  return (
    <section
      className={
        className ??
        "rounded-2xl border border-dashed border-kefoo-200 bg-gradient-to-r from-kefoo-50/80 via-white to-kefoo-50/80 p-6"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-kefoo-600">
        {formatCheckoutPlanLabel(targetPlan)} plan
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {FEATURE_UPGRADE_MESSAGES[feature]}
      </p>
      <Link
        href={`/checkout/${targetPlan}`}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kefoo-300"
      >
        Upgrade to {formatCheckoutPlanLabel(targetPlan)}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
