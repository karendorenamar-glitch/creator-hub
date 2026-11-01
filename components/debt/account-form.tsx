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
import { formatRupiah, todayISO } from "@/lib/debt/format";

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

function digits(value: string): number {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function DebtAccountForm({
  account,
  onDone,
}: {
  account?: DebtAccount;
  onDone: () => void;
}) {
  const [nominal, setNominal] = useState(
    account ? String(account.total_amount_due) : "",
  );
  const total = digits(nominal);
  const interest = account ? account.interest_fees : 0;
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

      <input type="hidden" name="interestFees" value={interest} />
      <input
        type="hidden"
        name="openingDate"
        value={account?.opening_date ?? todayISO()}
      />
      <input type="hidden" name="dueDate" value={account?.due_date ?? ""} />
      <input type="hidden" name="totalAmountDue" value={total} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama aplikasi" htmlFor="creditorName">
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
          label="Nama pinjaman / label"
          htmlFor="referenceLabel"
          hint="Satu aplikasi bisa memiliki beberapa pinjaman."
        >
          <input
            id="referenceLabel"
            name="referenceLabel"
            maxLength={120}
            defaultValue={account?.reference_label ?? ""}
            placeholder="Contoh: Pinjaman 1, iPhone, Modal usaha"
            className={inputClass}
          />
        </Field>

        <Field label="Jenis pinjaman" htmlFor="accountType">
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

        <Field label="Status akun" htmlFor="accountStatus">
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
          label="Nominal pinjaman (IDR)"
          htmlFor="nominal"
          hint={`Tersimpan sebagai ${formatRupiah(total)}.`}
          className="sm:col-span-2"
        >
          <input
            id="nominal"
            name="nominalDisplay"
            required
            inputMode="numeric"
            value={nominal}
            onChange={(event) => setNominal(event.target.value)}
            placeholder="Contoh: 5.000.000"
            className={inputClass}
          />
        </Field>

        <Field
          label="Status tenor"
          htmlFor="installmentMonth"
          hint="Contoh: 5 / 12 bulan. Isi 0 / 0 jika belum ditentukan."
        >
          <div className="flex items-center gap-2">
            <input
              id="installmentMonth"
              name="installmentMonth"
              type="number"
              min={0}
              max={999}
              defaultValue={account?.installment_month ?? 0}
              className={`${inputClass} text-center`}
            />
            <span className="text-sm text-ink-soft">/</span>
            <input
              name="installmentTotalMonths"
              type="number"
              min={0}
              max={999}
              defaultValue={account?.installment_total_months ?? 0}
              className={`${inputClass} text-center`}
            />
            <span className="shrink-0 text-sm text-ink-soft">bulan</span>
          </div>
        </Field>

        <Field
          label="Jatuh tempo setiap tanggal"
          htmlFor="dueDay"
          hint="Contoh: tanggal 5 setiap bulan."
        >
          <select
            id="dueDay"
            name="dueDay"
            defaultValue={account?.due_day ? String(account.due_day) : ""}
            className={inputClass}
          >
            <option value="">Tidak ditentukan</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                Tanggal {day}
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
          {pending ? "Menyimpan…" : account ? "Simpan perubahan" : "Tambah akun"}
        </button>
      </div>
    </form>
  );
}
