"use client";

import { ExportCsvButton } from "@/components/export/export-csv-button";
import {
  buildDashboardCsv,
  getDashboardCsvFilename,
} from "@/lib/csv-export";
import type { DashboardStats } from "@/types/database";

type DashboardExportCsvProps = {
  stats: DashboardStats;
  filterLabel: string;
  includePillarComparison?: boolean;
};

export function DashboardExportCsv({
  stats,
  filterLabel,
  includePillarComparison = false,
}: DashboardExportCsvProps) {
  return (
    <ExportCsvButton
      filename={getDashboardCsvFilename()}
      buildCsv={() =>
        buildDashboardCsv(stats, filterLabel, includePillarComparison)
      }
    />
  );
}
