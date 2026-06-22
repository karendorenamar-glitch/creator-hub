import type { CampaignStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-kefoo-100 text-kefoo-700",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "draft",
  "active",
  "paused",
  "completed",
];
