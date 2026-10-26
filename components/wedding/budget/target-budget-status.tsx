import { Card } from "@/components/wedding/ui";
import type { TargetBudgetStatus } from "@/lib/wedding/budget-calc";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function statusLabel(status: TargetBudgetStatus, copy: ModuleCopy) {
  switch (status) {
    case "under":
      return copy.budget.targetUnder;
    case "on":
      return copy.budget.targetOn;
    case "over":
      return copy.budget.targetOver;
    case "provisional":
      return copy.budget.targetProvisional;
    default:
      return copy.budget.targetUnset;
  }
}

function statusClass(status: TargetBudgetStatus) {
  switch (status) {
    case "under":
      return "border-olive-200 bg-olive-50 text-olive-900";
    case "on":
      return "border-champagne/70 bg-champagne/20 text-cocoa";
    case "over":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "provisional":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-olive-100 bg-cream text-ink-soft";
  }
}

export function TargetBudgetStatusCard({
  status,
  difference,
  targetBudget,
  vendorBudget,
  missingAgreedPriceCount,
  copy,
}: {
  status: TargetBudgetStatus;
  difference: number | null;
  targetBudget: number;
  vendorBudget: number;
  missingAgreedPriceCount: number;
  copy: ModuleCopy;
}) {
  let detail: string;
  if (status === "under" && difference !== null) {
    detail = copy.budget.targetUnderDetail.replace(
      "{amount}",
      formatIDR(difference),
    );
  } else if (status === "over" && difference !== null) {
    detail = copy.budget.targetOverDetail.replace(
      "{amount}",
      formatIDR(difference),
    );
  } else if (status === "on") {
    detail = copy.budget.targetOnDetail;
  } else if (status === "provisional") {
    detail = copy.budget.targetProvisionalDetail.replace(
      "{count}",
      String(missingAgreedPriceCount),
    );
  } else {
    detail = copy.budget.targetUnsetDetail;
  }

  return (
    <Card className={`border ${statusClass(status)}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] opacity-70">
            {copy.budget.targetStatus}
          </p>
          <p className="mt-1 font-heading text-xl font-semibold">
            {statusLabel(status, copy)}
          </p>
          <p className="mt-1 text-sm opacity-80">{detail}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="opacity-70">{copy.budget.targetBudget}</p>
          <p className="font-medium">
            {targetBudget > 0 ? formatIDR(targetBudget) : "—"}
          </p>
          <p className="mt-1 opacity-70">{copy.budget.vendorBudget}</p>
          <p className="font-medium">{formatIDR(vendorBudget)}</p>
        </div>
      </div>
    </Card>
  );
}
