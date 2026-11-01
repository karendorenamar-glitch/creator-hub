"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  createDebtPaymentAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { Card } from "@/components/wedding/ui";
import type { DebtSchedule } from "@/lib/debt/db-types";
import type { AccountBalance } from "@/lib/debt/calculations";
import { formatDebtDate, formatRupiah } from "@/lib/debt/format";

export function DebtPaymentForm({
  accounts,
  schedules,
  today,
}: {
  accounts: AccountBalance[];
  schedules: DebtSchedule[];
  today: string;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [scheduleId, setScheduleId] = useState("");
  const [state, action, pending] = useActionState<
    DebtActionResult,
    FormData
  >(createDebtPaymentAction, null);

  const selected = useMemo(
    () => accounts.find((account) => account.id === accountId),
    [accountId, accounts],
  );
  const accountSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.debt_account_id === accountId),
    [accountId, schedules],
  );

  if (accounts.length === 0) {
    return (
      <Card className="space-y-3 border-[#e8e1d4] bg-[#fffdf9]">
        <p className="text-sm text-ink-soft">
          Tambahkan akun terlebih dahulu sebelum mencatat pembayaran.
        </p>
        <Link
          href="/debt/accounts"
          className="inline-flex rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
        >
          Ke akun utang
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
            Setiap pembayaran adalah transaksi terpisah. Pembayaran sebagian tidak
            menutup akun secara otomatis.
          </p>
        </div>
        <FormAlert error={state?.error} success={state?.success} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Akun utang" htmlFor="debtAccountId">
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

          <Field label="Nominal (IDR)" htmlFor="paymentAmount">
            <input
              id="paymentAmount"
              name="amount"
              required
              inputMode="numeric"
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

          <Field
            label="Hubungkan ke jadwal"
            htmlFor="debtScheduleId"
            hint="Opsional. Hanya jadwal yang terhubung yang dapat berubah status otomatis."
          >
            <select
              id="debtScheduleId"
              name="scheduleId"
              value={scheduleId}
              onChange={(event) => setScheduleId(event.target.value)}
              className={inputClass}
            >
              <option value="">Tanpa jadwal</option>
              {accountSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {formatDebtDate(schedule.due_date)} ·{" "}
                  {formatRupiah(schedule.amount_due)} · {schedule.status}
                </option>
              ))}
            </select>
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
          <p className="rounded-xl bg-olive-50 px-3 py-2 text-xs text-ink-soft">
            Sisa akun saat ini:{" "}
            <strong className="text-ink">{formatRupiah(selected.remaining)}</strong>
            . Sisa dihitung dari total kontrak dikurangi pembayaran yang tercatat.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Menyimpan pembayaran…" : "Simpan pembayaran"}
        </button>
      </form>
    </Card>
  );
}
