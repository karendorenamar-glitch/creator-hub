"use client";

import { useTransition } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { deletePayout, updatePayoutStatus } from "@/app/actions/payouts";
import { PayoutInvoiceCell } from "@/components/payouts/payout-invoice-cell";
import { PayoutTimingBadge } from "@/components/payouts/payout-timing-badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatIDR } from "@/lib/utils";
import { formatPayoutStatusLabel } from "@/lib/payouts";
import type { PayoutWithTiming } from "@/types/database";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
} from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type PayoutsTableProps = {
  payouts: PayoutWithTiming[];
  onEdit: (payout: PayoutWithTiming) => void;
  onDelete: (payout: PayoutWithTiming) => void;
};

function PayoutStatusBadge({ status }: { status: PayoutWithTiming["status"] }) {
  const styles = {
    PENDING: "bg-slate-100 text-slate-700",
    PAID: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      {formatPayoutStatusLabel(status)}
    </span>
  );
}

export function PayoutsTable({ payouts, onEdit, onDelete }: PayoutsTableProps) {
  const { showSuccess, showError } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();

  function markPaid(payout: PayoutWithTiming) {
    startUpdateTransition(async () => {
      const result = await updatePayoutStatus(payout.id, "PAID");

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Payout marked as paid.");
    });
  }

  if (payouts.length === 0) {
    return (
      <DataTable>
        <EmptyState
          title="No payouts scheduled"
          description="Create a payout to track deadlines and payment status."
        />
      </DataTable>
    );
  }

  return (
    <DataTable>
      <DataTableElement>
        <DataTableHead>
          <DataTableHeaderCell>Creator</DataTableHeaderCell>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Amount</DataTableHeaderCell>
          <DataTableHeaderCell>Requested</DataTableHeaderCell>
          <DataTableHeaderCell>Due</DataTableHeaderCell>
          <DataTableHeaderCell>Timing</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>Invoice</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right">Actions</DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {payouts.map((payout) => (
            <DataTableRow key={payout.id}>
              <DataTableCell className="font-medium text-slate-900">
                {payout.creators?.name ?? "Unknown"}
              </DataTableCell>
              <DataTableCell className="text-slate-600">
                {payout.campaigns?.name ?? "—"}
              </DataTableCell>
              <DataTableCell className="text-right font-medium text-slate-900">
                {formatIDR(payout.amount)}
              </DataTableCell>
              <DataTableCell>{formatDate(payout.requested_at)}</DataTableCell>
              <DataTableCell>{formatDate(payout.due_date)}</DataTableCell>
              <DataTableCell>
                <PayoutTimingBadge
                  badge={payout.timingBadge}
                  timingLabel={payout.timingLabel}
                />
              </DataTableCell>
              <DataTableCell>
                <PayoutStatusBadge status={payout.status} />
              </DataTableCell>
              <DataTableCell>
                <PayoutInvoiceCell payout={payout} />
              </DataTableCell>
              <DataTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(payout)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit payout for ${payout.creators?.name ?? "creator"}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {payout.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => markPaid(payout)}
                      disabled={isUpdating}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label={`Mark ${payout.creators?.name ?? "payout"} as paid`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(payout)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete payout for ${payout.creators?.name ?? "creator"}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableElement>
    </DataTable>
  );
}
