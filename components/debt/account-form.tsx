"use client";

import { useActionState, useEffect } from "react";
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

export function DebtAccountForm({
  account,
  onDone,
}: {
  account?: DebtAccount;
  onDone: () => void;
}) {
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
            placeholder="Contoh: Pinjaman 1, iPhone, Modal usaha"
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

        <Field
          label="Nominal per bulan (IDR)"
          htmlFor="monthlyAmount"
          hint="Dipakai untuk membuat angsuran bulanan."
        >
          <input
            id="monthlyAmount"
            name="monthlyAmount"
            inputMode="numeric"
            defaultValue={
              account && account.installment_amount > 0
                ? String(account.installment_amount)
                : ""
            }
            placeholder="Contoh: 200.000"
            className={inputClass}
          />
        </Field>

        <Field
          label="Tenor (bulan)"
          htmlFor="tenorMonths"
          hint="Jumlah angsuran, misal 12."
        >
          <input
            id="tenorMonths"
            name="tenorMonths"
            type="number"
            min={0}
            max={600}
            defaultValue={
              account && account.installment_total_months > 0
                ? String(account.installment_total_months)
                : ""
            }
            placeholder="Contoh: 12"
            className={inputClass}
          />
        </Field>

        <Field
          label="Jatuh tempo tiap tanggal"
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

        <Field
          label="Bulan jatuh tempo pertama"
          htmlFor="firstDueMonth"
          hint="Angsuran pertama dimulai bulan ini."
        >
          <input
            id="firstDueMonth"
            name="firstDueMonth"
            type="month"
            defaultValue={
              account?.due_date?.slice(0, 7) ?? todayISO().slice(0, 7)
            }
            className={inputClass}
          />
        </Field>

        <Field
          label="Utang awal (IDR)"
          htmlFor="originalDebt"
          hint="Opsional. Otomatis dari nominal × tenor jika kosong."
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

        <Field
          label="Tanggal akhir (opsional)"
          htmlFor="finalDueDate"
          hint="Perkiraan pelunasan terakhir."
        >
          <input
            id="finalDueDate"
            name="finalDueDate"
            type="date"
            defaultValue={account?.due_date ?? ""}
            className={inputClass}
          />
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

      <p className="rounded-xl bg-olive-50 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
        Nominal per bulan otomatis dibuat menjadi angsuran di halaman{" "}
        <strong className="font-medium text-ink">Jadwal</strong>. Setiap angsuran
        bisa diedit dengan nominal berbeda, dan pembayaran dicatat per angsuran.
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
