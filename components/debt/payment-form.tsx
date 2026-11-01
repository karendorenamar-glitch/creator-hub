"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  createDebtPaymentAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { Card } from "@/components/wedding/ui";
import type { AccountSummary } from "@/lib/debt/calculations";
import { formatRupiah } from "@/lib/debt/format";

export function DebtPaymentForm({
  accounts,
  defaultAccountId,
  today,
}: {
  accounts: AccountSummary[];
  defaultAccountId: string;
  today: string;
}) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(
    defaultAccountId || accounts[0]?.id || "",
  );
  const selected = accounts.find((account) => account.id === accountId);
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
      <form
        action={async (formData) => {
          await action(formData);
          router.refresh();
        }}
        className="space-y-4"
      >
        <div>
          <h2 className="font-heading text-xl text-ink">Catat pembayaran</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Pembayaran sebagian atau penuh dicatat sebagai transaksi. Riwayat
            tidak dihapus saat utang ditutup.
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
              onChange={(event) => setAccountId(event.target.value)}
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
            label="Nominal dibayar (IDR)"
            htmlFor="paymentAmount"
            hint={
              selected
                ? `Sisa tagihan ${formatRupiah(selected.remaining)}.`
                : undefined
            }
          >
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

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Menyimpan…" : "Simpan pembayaran"}
        </button>
      </form>
    </Card>
  );
}
