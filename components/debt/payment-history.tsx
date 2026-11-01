"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/wedding/ui";
import { ConfirmAction } from "@/components/debt/confirm-action";
import { reverseDebtPaymentAction } from "@/app/debt/actions";
import type { AccountBalance } from "@/lib/debt/calculations";
import type { DebtPayment } from "@/lib/debt/db-types";
import { formatDebtDate, formatRupiah } from "@/lib/debt/format";

export function DebtPaymentHistory({
  payments,
  accounts,
}: {
  payments: DebtPayment[];
  accounts: AccountBalance[];
}) {
  const [accountId, setAccountId] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "reversed">("all");
  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.creditor_name])),
    [accounts],
  );

  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        if (accountId !== "all" && payment.debt_account_id !== accountId) {
          return false;
        }
        if (status === "active" && payment.reversed_at) return false;
        if (status === "reversed" && !payment.reversed_at) return false;
        return true;
      }),
    [accountId, payments, status],
  );

  if (payments.length === 0) {
    return (
      <EmptyState
        title="Belum ada pembayaran"
        body="Pembayaran yang dicatat akan muncul di sini sebagai riwayat transaksi."
        icon={<ReceiptText className="size-8" aria-hidden />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 border-[#e8e1d4] bg-[#fffdf9] p-4">
        <label className="space-y-1.5 text-xs font-medium text-ink-soft">
          Akun
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="block min-w-48 rounded-xl border border-olive-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-olive-400"
          >
            <option value="all">Semua akun</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.creditor_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-ink-soft">
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | "active" | "reversed")
            }
            className="block rounded-xl border border-olive-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-olive-400"
          >
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="reversed">Dibatalkan</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-ink-soft">
          {filtered.length} transaksi
        </span>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi"
          body="Coba pilih akun atau status lain."
          icon={<ReceiptText className="size-8" aria-hidden />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => {
            const reversed = Boolean(payment.reversed_at);
            return (
              <Card
                key={payment.id}
                className={`border-[#e8e1d4] p-4 ${
                  reversed ? "bg-[#fbf8f3] opacity-75" : "bg-[#fffdf9]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg text-ink">
                        {formatRupiah(payment.amount)}
                      </p>
                      <Badge tone={reversed ? "muted" : "success"}>
                        {reversed ? "Dibatalkan" : "Tercatat"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {accountNames.get(payment.debt_account_id) ?? "Akun"} ·{" "}
                      {formatDebtDate(payment.payment_date)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {[payment.payment_method, payment.reference]
                        .filter(Boolean)
                        .join(" · ") || "Tanpa metode/referensi"}
                    </p>
                    {payment.notes ? (
                      <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-soft">
                        {payment.notes}
                      </p>
                    ) : null}
                    {reversed ? (
                      <p className="mt-2 text-xs text-rose-700">
                        Dibatalkan {formatDebtDate(payment.reversed_at?.slice(0, 10))}
                        {payment.reversal_reason
                          ? ` · ${payment.reversal_reason}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  {!reversed ? (
                    <ConfirmAction
                      action={reverseDebtPaymentAction}
                      fields={{ id: payment.id }}
                      label="Batalkan pembayaran"
                      confirmLabel="Ya, batalkan"
                      message="Pembayaran tidak akan dihapus. Transaksi tetap tersimpan, tetapi tidak dihitung lagi dalam saldo."
                      withReason
                      tone="neutral"
                    />
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
