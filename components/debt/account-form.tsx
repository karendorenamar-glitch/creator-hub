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
  const [principal, setPrincipal] = useState(
    account ? String(account.original_principal) : "",
  );
  const [interest, setInterest] = useState(
    account ? String(account.interest_fees) : "0",
  );
  const total = digits(principal) + digits(interest);
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
        <Field label="Nama kreditur / aplikasi" htmlFor="creditorName">
          <input
            id="creditorName"
            name="creditorName"
            required
            maxLength={120}
            defaultValue={account?.creditor_name ?? ""}
            placeholder="Contoh: Bank Mandiri"
            className={inputClass}
          />
        </Field>

        <Field label="Jenis akun" htmlFor="accountType">
          <select
            id="accountType"
            name="accountType"
            defaultValue={account?.account_type ?? "other"}
            className={inputClass}
          >
            {ACCOUNT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Label referensi" htmlFor="referenceLabel">
          <input
            id="referenceLabel"
            name="referenceLabel"
            maxLength={120}
            defaultValue={account?.reference_label ?? ""}
            placeholder="Nomor kartu, nomor pinjaman, dll."
            className={inputClass}
          />
        </Field>

        <Field label="Status" htmlFor="accountStatus">
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

        <Field label="Pokok awal (IDR)" htmlFor="originalPrincipal">
          <input
            id="originalPrincipal"
            name="originalPrincipal"
            required
            inputMode="numeric"
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </Field>

        <Field label="Bunga / biaya (IDR)" htmlFor="interestFees">
          <input
            id="interestFees"
            name="interestFees"
            inputMode="numeric"
            value={interest}
            onChange={(event) => setInterest(event.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </Field>
        <Field label="Total kontrak (IDR)" htmlFor="totalAmountDue">
          <input type="hidden" name="totalAmountDue" value={total} />
          <div className="rounded-xl border border-olive-100 bg-olive-50/60 px-3.5 py-2.5 text-sm font-medium text-ink">
            {formatRupiah(total)}
          </div>
          <p className="text-xs text-ink-soft">
            Dihitung otomatis dari pokok + bunga/biaya.
          </p>
        </Field>

        <Field label="Tanggal pembukaan" htmlFor="openingDate">
          <input
            id="openingDate"
            name="openingDate"
            type="date"
            required
            defaultValue={account?.opening_date ?? todayISO()}
            className={inputClass}
          />
        </Field>

        <Field label="Jatuh tempo" htmlFor="dueDate">
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={account?.due_date ?? ""}
            className={inputClass}
          />
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
