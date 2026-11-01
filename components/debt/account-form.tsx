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
import { formatRupiah, nextDueDateForDay, todayISO } from "@/lib/debt/format";

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
    account
      ? String(
          account.installment_amount > 0
            ? account.installment_amount
            : account.installment_total_months > 0
              ? Math.round(
                  account.total_amount_due / account.installment_total_months,
                )
              : account.total_amount_due,
        )
      : "",
  );
  const [totalNominal, setTotalNominal] = useState(
    account ? String(account.total_amount_due) : "",
  );
  const [variableMode, setVariableMode] = useState(
    account ? account.installment_amount <= 0 : false,
  );
  const [totalMonths, setTotalMonths] = useState(
    account ? String(account.installment_total_months) : "0",
  );
  const installments = digits(totalMonths);
  const total = variableMode
    ? digits(totalNominal)
    : digits(nominal) * (installments > 0 ? installments : 1);
  const interest = account ? account.interest_fees : 0;
  const defaultDueMonth =
    account?.due_date?.slice(0, 7) ??
    nextDueDateForDay(account?.due_day ?? 3).slice(0, 7);
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

      <Field
        label="Model cicilan"
        htmlFor="variableMode"
        hint="Pilih bervariasi jika nominal tiap bulan berbeda."
      >
        <select
          id="variableMode"
          name="variableMode"
          value={variableMode ? "1" : "0"}
          onChange={(event) => setVariableMode(event.target.value === "1")}
          className={inputClass}
        >
          <option value="0">Nominal tetap setiap bulan</option>
          <option value="1">Nominal berbeda tiap bulan</option>
        </select>
      </Field>

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

        {variableMode ? (
          <Field
            label="Total kontrak (IDR)"
            htmlFor="totalNominal"
            hint="Rincian nominal tiap bulan ditambahkan di halaman Jadwal."
            className="sm:col-span-2"
          >
            <input
              id="totalNominal"
              name="totalAmountDue"
              required
              inputMode="numeric"
              value={totalNominal}
              onChange={(event) => setTotalNominal(event.target.value)}
              placeholder="Contoh: 2.000.000"
              className={inputClass}
            />
          </Field>
        ) : (
          <Field
            label="Nominal per angsuran (IDR)"
            htmlFor="nominal"
            hint={`Total kontrak yang dihitung: ${formatRupiah(total)}.`}
            className="sm:col-span-2"
          >
            <input
              id="nominal"
              name="installmentAmount"
              required
              inputMode="numeric"
              value={nominal}
              onChange={(event) => setNominal(event.target.value)}
              placeholder="Contoh: 200.000"
              className={inputClass}
            />
          </Field>
        )}

        <Field
          label="Sudah dibayar / total tenor"
          htmlFor="installmentMonth"
          hint="Contoh: 10 / 12 bulan. Sisa = 2 × nominal angsuran."
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
              value={totalMonths}
              onChange={(event) => setTotalMonths(event.target.value)}
              className={`${inputClass} text-center`}
            />
            <span className="shrink-0 text-sm text-ink-soft">bulan</span>
          </div>
        </Field>

        <Field
          label="Bulan jatuh tempo"
          htmlFor="dueMonth"
          hint="Pilih bulan tagihan berikutnya."
        >
          <input
            id="dueMonth"
            name="dueMonth"
            type="month"
            defaultValue={defaultDueMonth}
            className={inputClass}
          />
        </Field>

        <Field
          label="Tanggal jatuh tempo"
          htmlFor="dueDay"
          hint="Contoh: setiap tanggal 3."
        >
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
