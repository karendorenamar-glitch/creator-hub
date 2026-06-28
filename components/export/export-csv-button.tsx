"use client";

import { Download } from "lucide-react";
import { useRequirePlanFeature } from "@/components/plan/plan-provider";
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
  const requireExport = useRequirePlanFeature("export_csv");

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
    </button>
  );
}
