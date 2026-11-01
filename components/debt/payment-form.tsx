"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  createDebtPaymentAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { Badge, Card } from "@/components/wedding/ui";
import type { AccountSummary, Installment } from "@/lib/debt/calculations";
import { formatDebtDate, formatRupiah } from "@/lib/debt/format";

const STATUS_LABELS = {
  upcoming: "Akan datang",
  unpaid: "Belum dibayar",
  partially_paid: "Dibayar sebagian",
  paid: "Lunas",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
} as const;

export function DebtPaymentForm({
  accounts,
  installments,
  defaultAccountId,
  defaultScheduleId,
  today,
}: {
  accounts: AccountSummary[];
  installments: Installment[];
  defaultAccountId: string;
  defaultScheduleId: string;
  today: string;
}) {
  const [accountId, setAccountId] = useState(
    defaultAccountId || accounts[0]?.id || "",
  );
  const [scheduleId, setScheduleId] = useState(defaultScheduleId);
  const accountInstallments = useMemo(
    () =>
      installments.filter(
        (item) =>
          item.account.id === accountId &&
          item.remaining > 0 &&
          item.status !== "cancelled",
      ),
    [accountId, installments],
  );
  const selected = accountInstallments.find(
    (item) => item.schedule.id === scheduleId,
  );
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    createDebtPaymentAction,
    null,
  );

  if (accounts.length === 0) {
    return (
      <Card className="space-y-3 border-[#e8e1d4] bg-[#fffdf9]">
        <p className="text-sm text-ink-soft">
          Tambahkan utang terlebih dahulu sebelum mencatat pembayaran.
        </p>
        <Link
          href="/debt/accounts"
          className="inline-flex rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
        >
          Ke daftar utang
        </Link>
      </Card>
    );
  }

  return (
    <Card className="border-[#e8e1d4] bg-[#fffdf9]">
      <form action={action} className="space-y-4">
        <div>
          <h2 className="font-heading text-xl text-ink">Catat pembayaran</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Setiap pembayaran dicatat pada satu angsuran. Pembayaran sebagian
            tidak menutup angsuran berikutnya.
          </p>
        </div>
        <FormAlert error={state?.error} success={state?.success} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Utang" htmlFor="debtAccountId">
            <select
              id="debtAccountId"
              name="debtAccountId"
              required
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setScheduleId("");
              }}
              className={inputClass}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.creditor_name} · sisa {formatRupiah(account.remaining)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Angsuran"
            htmlFor="debtScheduleId"
            hint="Hanya angsuran yang masih punya sisa."
          >
            <select
              id="debtScheduleId"
              name="scheduleId"
              required
              value={scheduleId}
              onChange={(event) => {
                setScheduleId(event.target.value);
              }}
              className={inputClass}
            >
              <option value="">
                {accountInstallments.length === 0
                  ? "Tidak ada angsuran bersisa"
                  : "Pilih angsuran"}
              </option>
              {accountInstallments.map((item) => (
                <option key={item.schedule.id} value={item.schedule.id}>
                  {formatDebtDate(item.schedule.due_date)} · sisa {formatRupiah(item.remaining)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nominal dibayar (IDR)" htmlFor="paymentAmount">
            <input
              id="paymentAmount"
              name="amount"
              required
              inputMode="numeric"
              key={`${scheduleId}:${selected?.remaining ?? 0}`}
              defaultValue={selected ? String(selected.remaining) : ""}
              placeholder="0"
              className={inputClass}
            />
          </Field>

          <Field label="Tanggal pembayaran" htmlFor="paymentDate">
            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={today}
              className={inputClass}
            />
          </Field>

          <Field label="Metode pembayaran" htmlFor="paymentMethod">
            <input
              id="paymentMethod"
              name="paymentMethod"
              maxLength={80}
              placeholder="Transfer bank, tunai, dll."
              className={inputClass}
            />
          </Field>

          <Field label="Referensi" htmlFor="paymentReference">
            <input
              id="paymentReference"
              name="reference"
              maxLength={200}
              placeholder="Nomor transaksi / berita transfer"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Catatan" htmlFor="paymentNotes">
          <textarea
            id="paymentNotes"
            name="notes"
            rows={3}
            maxLength={2000}
            className={inputClass}
            placeholder="Catatan pembayaran (opsional)."
          />
        </Field>

        {selected ? (
          <div className="space-y-2 rounded-xl bg-olive-50 px-3 py-2 text-xs text-ink-soft">
            <p>
              Angsuran {formatDebtDate(selected.schedule.due_date)}: tagihan
              <strong className="ml-1 text-ink">{formatRupiah(selected.schedule.amount_due)}</strong>,
              dibayar
              <strong className="mx-1 text-ink">{formatRupiah(selected.paid)}</strong>,
              sisa
              <strong className="ml-1 text-ink">{formatRupiah(selected.remaining)}</strong>.
            </p>
            <Badge tone={selected.status === "overdue" ? "blush" : "warning"}>
              {STATUS_LABELS[selected.status]}
            </Badge>
          </div>
        ) : accountInstallments.length === 0 ? (
          <p className="rounded-xl bg-olive-50 px-3 py-2 text-xs text-ink-soft">
            Utang ini belum punya angsuran bersisa. Tambahkan angsuran di
            <Link
              href={`/debt/schedule?account=${accountId}`}
              className="mx-1 font-medium text-olive-700 hover:underline"
            >
              halaman Jadwal
            </Link>
            .
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !selected}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Menyimpan…" : "Simpan pembayaran"}
        </button>
      </form>
    </Card>
  );
}
