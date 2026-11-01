"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createDebtAccountAction,
  updateDebtAccountAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import type { DebtAccount } from "@/lib/debt/db-types";
import { formatRupiah, monthLabel, todayISO } from "@/lib/debt/format";

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

function toAmount(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addMonthsToMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
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
  const [monthlyAmount, setMonthlyAmount] = useState(
    account && account.installment_amount > 0
      ? String(account.installment_amount)
      : "",
  );
  const [firstDueMonth, setFirstDueMonth] = useState(
    account?.due_date?.slice(0, 7) ?? todayISO().slice(0, 7),
  );
  const [vary, setVary] = useState(false);

  const router = useRouter();
  const action = account ? updateDebtAccountAction : createDebtAccountAction;
  const [state, formAction, pending] = useActionState<
    DebtActionResult,
    FormData
  >(action, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state?.success, onDone, router]);

  const totalMonths = Number(tenorTotal || 0);
  const paidMonths = Number(tenorPaid || 0);
  const openMonths = Math.max(0, totalMonths - paidMonths);
  const monthly = toAmount(monthlyAmount);
  const remaining = Math.max(0, monthly * openMonths);
  const openingDate = account?.opening_date ?? todayISO();

  return (
    <form action={formAction} className="space-y-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <input type="hidden" name="formMode" value={account ? "edit" : "create"} />
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
          hint="Contoh: 5 / 12 bulan."
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

        <Field
          label="Nominal per bulan (IDR)"
          htmlFor="monthlyAmount"
          hint={
            vary
              ? "Dipakai sebagai isi awal daftar nominal di bawah."
              : "Nominal yang sama untuk setiap angsuran."
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
      </div>

      <input type="hidden" name="vary" value={vary ? "1" : "0"} />

      <div className="space-y-3 rounded-xl border border-olive-100 bg-[#f8f4ec] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-ink">Nominal per bulan</p>
          <span className="text-[11px] text-ink-soft">
            {openMonths > 0 ? `${openMonths} bulan belum dibayar` : "isi tenor dulu"}
          </span>
        </div>

        <div role="radiogroup" aria-label="Model nominal" className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            role="radio"
            aria-checked={!vary}
            onClick={() => setVary(false)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              !vary
                ? "border-olive-600 bg-olive-50"
                : "border-olive-100 bg-white hover:bg-olive-50/60"
            }`}
          >
            <span className="block text-sm font-medium text-ink">Sama tiap bulan</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
              Satu nominal untuk semua sisa angsuran.
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={vary}
            onClick={() => setVary(true)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              vary
                ? "border-olive-600 bg-olive-50"
                : "border-olive-100 bg-white hover:bg-olive-50/60"
            }`}
          >
            <span className="block text-sm font-medium text-ink">Beda tiap bulan</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
              Isi nominal per bulan, tanggal tetap sama.
            </span>
          </button>
        </div>

        {vary ? (
          openMonths > 0 ? (
            <div className="space-y-2">
              {Array.from({ length: openMonths }, (_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1.1fr] items-center gap-2"
                >
                  <span className="text-sm text-ink-soft">
                    {monthLabel(addMonthsToMonth(firstDueMonth, index))}
                  </span>
                  <input
                    name="amount"
                    inputMode="numeric"
                    required
                    defaultValue={monthlyAmount}
                    placeholder="Nominal"
                    aria-label={`Nominal bulan ke-${index + 1}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white px-3 py-2 text-xs text-ink-soft">
              Isi total tenor lebih besar dari jumlah yang sudah dibayar agar
              daftar bulan muncul.
            </p>
          )
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bulan jatuh tempo" htmlFor="firstDueMonth">
          <input
            id="firstDueMonth"
            name="firstDueMonth"
            type="month"
            value={firstDueMonth}
            onChange={(event) => setFirstDueMonth(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Tanggal jatuh tempo" htmlFor="dueDay">
          <select
            id="dueDay"
            name="dueDay"
            defaultValue={account?.due_day ? String(account.due_day) : "3"}
            className={inputClass}
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                Tanggal {day}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!vary && openMonths > 0 && monthly > 0 ? (
        <p className="rounded-xl bg-olive-50 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          Sisa <strong className="text-ink">{openMonths} angsuran</strong> x{" "}
          {formatRupiah(monthly)} ={" "}
          <strong className="text-ink">{formatRupiah(remaining)}</strong>
          {totalMonths > 0
            ? `, dari total ${totalMonths} bulan (${formatRupiah(
                monthly * totalMonths,
              )}).`
            : "."}
        </p>
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
            defaultValue={openingDate}
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
      </div>

      <Field label="Catatan" htmlFor="accountNotes">
        <textarea
          id="accountNotes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={account?.notes ?? ""}
          className={inputClass}
          placeholder="Catatan internal (opsional)."
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
