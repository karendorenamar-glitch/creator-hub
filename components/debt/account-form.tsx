"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  createDebtAccountAction,
  updateDebtAccountAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { DebtAccount } from "@/lib/debt/db-types";
import { todayISO } from "@/lib/debt/format";

const ACCOUNT_TYPES = [
  ["bank_loan", "Pinjaman bank"],
  ["credit_card", "Kartu kredit"],
  ["personal_loan", "Pinjaman pribadi"],
  ["installment", "Cicilan"],
  ["other", "Lainnya"],
] as const;

const STATUSES = [
  ["active", "Aktif"],
  ["paid", "Lunas"],
  ["closed", "Ditutup"],
] as const;

function addMonthsTo(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function DebtAccountForm({
  account,
  onDone,
}: {
  account?: DebtAccount;
  onDone: () => void;
}) {
  const [tenorPaid, setTenorPaid] = useState(
    account && account.installment_month > 0
      ? String(account.installment_month)
      : "0",
  );
  const [tenorTotal, setTenorTotal] = useState(
    account && account.installment_total_months > 0
      ? String(account.installment_total_months)
      : "",
  );
  const [mode, setMode] = useState<"same" | "custom">(
    account ? (account.installment_amount > 0 ? "same" : "custom") : "same",
  );
  const [monthlyAmount, setMonthlyAmount] = useState(
    account && account.installment_amount > 0
      ? String(account.installment_amount)
      : "",
  );
  const [firstDueMonth, setFirstDueMonth] = useState(
    account?.due_date?.slice(0, 7) ?? todayISO().slice(0, 7),
  );
  const [dueDay, setDueDay] = useState(
    account?.due_day ? String(account.due_day) : "3",
  );

  const totalMonths = Number(tenorTotal || 0);
  const paidMonths = Number(tenorPaid || 0);
  const remainingMonths = Math.max(0, totalMonths - paidMonths);
  const rowsKey = `${firstDueMonth}:${remainingMonths}:${mode}`;

  const action = account ? updateDebtAccountAction : createDebtAccountAction;
  const [state, formAction, pending] = useActionState<
    DebtActionResult,
    FormData
  >(action, null);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state?.success, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <FormAlert error={state?.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama utang / kreditur" htmlFor="creditorName">
          <input
            id="creditorName"
            name="creditorName"
            required
            maxLength={120}
            defaultValue={account?.creditor_name ?? ""}
            placeholder="Contoh: Shopee PayLater, Bank Mandiri"
            className={inputClass}
          />
        </Field>

        <Field
          label="Label (opsional)"
          htmlFor="referenceLabel"
          hint="Pembeda jika satu aplikasi punya beberapa pinjaman."
        >
          <input
            id="referenceLabel"
            name="referenceLabel"
            maxLength={120}
            defaultValue={account?.reference_label ?? ""}
            placeholder="Contoh: Pinjaman 1, iPhone"
            className={inputClass}
          />
        </Field>

        <Field
          label="Tenor (sudah dibayar / total)"
          hint="Contoh: 5 / 12 bulan. Sisa angsuran dihitung otomatis."
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-2">
            <input
              name="tenorPaid"
              type="number"
              min={0}
              max={600}
              value={tenorPaid}
              onChange={(event) => setTenorPaid(event.target.value)}
              className={`${inputClass} text-center`}
              aria-label="Sudah dibayar (bulan)"
            />
            <span className="text-sm text-ink-soft">/</span>
            <input
              name="tenorTotal"
              type="number"
              min={0}
              max={600}
              value={tenorTotal}
              onChange={(event) => setTenorTotal(event.target.value)}
              placeholder="12"
              className={`${inputClass} text-center`}
              aria-label="Total tenor (bulan)"
            />
            <span className="shrink-0 text-sm text-ink-soft">bulan</span>
          </div>
        </Field>
      </div>

      <Field
        label="Nominal per bulan"
        hint="Pilih apakah nominalnya sama sampai lunas atau berbeda tiap bulan."
      >
        <div role="radiogroup" aria-label="Model nominal" className="grid gap-2 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              mode === "same"
                ? "border-olive-600 bg-olive-50"
                : "border-olive-100 bg-white hover:bg-olive-50/60"
            }`}
          >
            <input
              type="radio"
              name="amountMode"
              value="same"
              checked={mode === "same"}
              onChange={() => setMode("same")}
              className="sr-only"
            />
            <span className="block text-sm font-medium text-ink">
              Samakan nominal hingga akhir tempo
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
              Satu nominal untuk semua sisa angsuran.
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${
              mode === "custom"
                ? "border-olive-600 bg-olive-50"
                : "border-olive-100 bg-white hover:bg-olive-50/60"
            }`}
          >
            <input
              type="radio"
              name="amountMode"
              value="custom"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
              className="sr-only"
            />
            <span className="block text-sm font-medium text-ink">
              Nominal berbeda
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
              Isi nominal per bulan sendiri-sendiri.
            </span>
          </label>
        </div>
      </Field>

      {mode === "same" ? (
        <Field
          label="Nominal per bulan (IDR)"
          htmlFor="monthlyAmount"
          hint={
            totalMonths > 0
              ? `Total kontrak dihitung: ${totalMonths} bulan x nominal.`
              : "Isi tenor di atas agar angsuran dibuat otomatis."
          }
        >
          <input
            id="monthlyAmount"
            name="monthlyAmount"
            inputMode="numeric"
            value={monthlyAmount}
            onChange={(event) => setMonthlyAmount(event.target.value)}
            placeholder="Contoh: 200.000"
            className={inputClass}
          />
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jatuh tempo tiap tanggal" htmlFor="dueDay">
          <select
            id="dueDay"
            name="dueDay"
            value={dueDay}
            onChange={(event) => setDueDay(event.target.value)}
            className={inputClass}
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                Tanggal {day}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Bulan angsuran pertama"
          htmlFor="firstDueMonth"
          hint="Angsuran pertama yang belum dibayar."
        >
          <input
            id="firstDueMonth"
            name="firstDueMonth"
            type="month"
            value={firstDueMonth}
            onChange={(event) => setFirstDueMonth(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {mode === "custom" && remainingMonths > 0 ? (
        <div className="space-y-2 rounded-xl border border-olive-100 bg-[#f8f4ec] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink">
              Nominal tiap bulan ({remainingMonths} angsuran)
            </p>
            <span className="text-[11px] text-ink-soft">
              {paidMonths}/{totalMonths} bulan sudah dibayar
            </span>
          </div>
          {Array.from({ length: remainingMonths }, (_, index) => {
            const month = addMonthsTo(firstDueMonth, index);
            return (
              <div
                key={`${rowsKey}:${index}`}
                className="grid grid-cols-2 gap-2"
              >
                <input
                  type="month"
                  name="customMonth"
                  defaultValue={month}
                  className={inputClass}
                  aria-label={`Bulan angsuran ke-${paidMonths + index + 1}`}
                />
                <input
                  name="customAmount"
                  inputMode="numeric"
                  defaultValue={monthlyAmount}
                  placeholder="Nominal"
                  className={inputClass}
                  aria-label={`Nominal angsuran ke-${paidMonths + index + 1}`}
                />
              </div>
            );
          })}
          <p className="text-[11px] leading-relaxed text-ink-soft">
            Nominal bulan yang sudah dibayar tidak dimasukkan. Isi utang awal
            jika ingin progres pembayaran ikut terhitung.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Utang awal (IDR)"
          htmlFor="originalDebt"
          hint="Opsional. Otomatis dari nominal x tenor jika kosong."
        >
          <input
            id="originalDebt"
            name="originalDebt"
            inputMode="numeric"
            defaultValue={
              account && account.total_amount_due > 0
                ? String(account.total_amount_due)
                : ""
            }
            placeholder="Contoh: 2.400.000"
            className={inputClass}
          />
        </Field>

        <Field label="Tanggal mulai" htmlFor="openingDate">
          <input
            id="openingDate"
            name="openingDate"
            type="date"
            required
            defaultValue={account?.opening_date ?? todayISO()}
            className={inputClass}
          />
        </Field>

        <Field label="Jenis utang" htmlFor="accountType">
          <select
            id="accountType"
            name="accountType"
            defaultValue={account?.account_type ?? "installment"}
            className={inputClass}
          >
            {ACCOUNT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status utang" htmlFor="accountStatus">
          <select
            id="accountStatus"
            name="status"
            defaultValue={account?.status ?? "active"}
            className={inputClass}
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Tanggal akhir (opsional)"
          htmlFor="finalDueDate"
          className="sm:col-span-2"
        >
          <input
            id="finalDueDate"
            name="finalDueDate"
            type="date"
            defaultValue={account?.due_date ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      {mode === "custom" && remainingMonths === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Isi total tenor lebih besar dari angsuran yang sudah dibayar agar kotak
          nominal muncul.
        </p>
      ) : null}

      <p className="rounded-xl bg-olive-50 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
        Angsuran otomatis dibuat dari isian di atas. Setelah tersimpan, tiap
        angsuran bisa diedit di halaman{" "}
        <strong className="font-medium text-ink">Jadwal</strong>.
      </p>

      <Field label="Catatan" htmlFor="accountNotes">
        <textarea
          id="accountNotes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={account?.notes ?? ""}
          className={inputClass}
          placeholder="Catatan internal, tenor, atau kesepakatan."
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-olive-100 pt-4">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-olive-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Menyimpan…" : account ? "Simpan perubahan" : "Tambah utang"}
        </button>
      </div>
    </form>
  );
}
