"use client";

import { Download, Lock } from "lucide-react";
import { usePlan, useRequirePlanFeature } from "@/components/plan/plan-provider";
import { downloadCsv } from "@/lib/csv-export";
import { cn } from "@/lib/utils";

type ExportCsvButtonProps = {
  filename: string;
  buildCsv: () => string;
  label?: string;
  className?: string;
};

export function ExportCsvButton({
  filename,
  buildCsv,
  label = "Export CSV",
  className,
}: ExportCsvButtonProps) {
  const { hasFeature } = usePlan();
  const requireExport = useRequirePlanFeature("export_csv");
  const canExport = hasFeature("export_csv");

  function handleClick() {
    requireExport(() => {
      downloadCsv(filename, buildCsv());
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {label}
      {!canExport ? <Lock className="h-3.5 w-3.5 opacity-60" /> : null}
    </button>
  );
}
