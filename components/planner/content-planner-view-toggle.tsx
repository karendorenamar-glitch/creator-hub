"use client";

import { CalendarDays, List } from "lucide-react";
import type { ContentPlannerView } from "@/lib/content-planner";
import { cn } from "@/lib/utils";

type ContentPlannerViewToggleProps = {
  view: ContentPlannerView;
  onChange: (view: ContentPlannerView) => void;
};

export function ContentPlannerViewToggle({
  view,
  onChange,
}: ContentPlannerViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => onChange("calendar")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "calendar"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        )}
      >
        <CalendarDays className="h-4 w-4" />
        Calendar View
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "list"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900",
        )}
      >
        <List className="h-4 w-4" />
        List View
      </button>
    </div>
  );
}
