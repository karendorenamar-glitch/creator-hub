"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Pencil,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";
import { Badge, Card, EmptyState, Progress } from "@/components/wedding/ui";
import { FormModal } from "@/components/wedding/form-modal";
import { ConfirmAction } from "@/components/debt/confirm-action";
import { DebtAccountForm } from "@/components/debt/account-form";
import type { AccountBalance } from "@/lib/debt/calculations";
import {
  deleteDebtAccountAction,
  payDebtInstallmentAction,
} from "@/app/debt/actions";
import {
  daysUntil,
  formatDebtDate,
  formatRupiah,
  nextDueDateForDay,
} from "@/lib/debt/format";
import type { DebtAccountType } from "@/lib/debt/db-types";

const TYPE_LABELS: Record<DebtAccountType, string> = {
  bank_loan: "Pinjaman bank",
  credit_card: "Kartu kredit",
  personal_loan: "Pinjaman pribadi",
  installment: "Cicilan",
  other: "Lainnya",
};

const STATUS_LABELS = {
  active: "Aktif",
  paid: "Lunas",
  closed: "Ditutup",
} as const;

type DueFilter = "all" | "overdue" | "7d" | "30d";

function statusTone(status: AccountBalance["status"]) {
  if (status === "paid") return "success" as const;
  if (status === "closed") return "muted" as const;
  return "warning" as const;
}

export function DebtAccountManager({
  accounts,
  paymentsReady,
}: {
  accounts: AccountBalance[];
  paymentsReady: boolean;
}) {
  const [editing, setEditing] = useState<AccountBalance | null | undefined>(
    undefined,
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AccountBalance["status"]>("all");
  const [due, setDue] = useState<DueFilter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts.filter((account) => {
      if (status !== "all" && account.status !== status) return false;
      if (
        needle &&
        !`${account.creditor_name} ${account.reference_label ?? ""}`
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      if (due === "all") return true;
      const dueDate = account.due_date
        ? account.due_date
        : account.nextSchedule
          ? account.nextSchedule.due_date
          : account.due_day
            ? nextDueDateForDay(account.due_day)
            : null;
      if (!dueDate || account.remaining <= 0) return false;
      const days = daysUntil(dueDate);
      if (due === "overdue") return days < 0;
      if (due === "7d") return days >= 0 && days <= 7;
      return days >= 0 && days <= 30;
    });
  }, [accounts, due, query, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            <Plus className="size-4" aria-hidden /> Tambah akun
          </button>
          <Link
            href="/debt/payments"
            className="inline-flex items-center gap-2 rounded-xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-olive-50"
          >
            <WalletCards className="size-4" aria-hidden /> Catat pembayaran
          </Link>
        </div>
        <span className="text-xs text-ink-soft">
          {filtered.length} dari {accounts.length} akun
        </span>
      </div>

      {!paymentsReady ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Tombol <strong>Bayar angsuran</strong> akan aktif setelah migration
          <code className="mx-1">043</code> diterapkan.
        </p>
      ) : null}

      <Card className="space-y-3 border-[#e8e1d4] bg-[#fffdf9] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-soft" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kreditur atau label referensi…"
            aria-label="Cari akun"
            className="w-full rounded-xl border border-olive-100 bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-olive-400"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              ["all", "Semua status"],
              ["active", "Aktif"],
              ["paid", "Lunas"],
              ["closed", "Ditutup"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full border px-3 py-1.5 ${
                status === value
                  ? "border-olive-600 bg-olive-600 text-white"
                  : "border-olive-100 bg-white text-ink-soft hover:bg-olive-50"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 border-l border-olive-100 sm:block" />
          {(
            [
              ["all", "Semua jatuh tempo"],
              ["overdue", "Terlambat"],
              ["7d", "7 hari"],
              ["30d", "30 hari"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDue(value)}
              className={`rounded-full border px-3 py-1.5 ${
                due === value
                  ? "border-olive-600 bg-olive-600 text-white"
                  : "border-olive-100 bg-white text-ink-soft hover:bg-olive-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={accounts.length === 0 ? "Belum ada akun" : "Tidak ada hasil"}
          body={
            accounts.length === 0
              ? "Tambahkan utang pertama untuk mulai menghitung sisa dan jadwal pembayaran."
              : "Coba ubah kata kunci atau filter."
          }
          icon={<WalletCards className="size-8" aria-hidden />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((account) => {
            const dueDate = account.due_date
              ? account.due_date
              : account.nextSchedule
                ? account.nextSchedule.due_date
                : account.due_day
                  ? nextDueDateForDay(account.due_day)
                  : null;
            const dueDays = dueDate ? daysUntil(dueDate) : null;
            const overdue =
              account.status === "active" &&
              dueDays !== null &&
              dueDays < 0 &&
              account.remaining > 0;
            const canPay =
              paymentsReady &&
              account.status === "active" &&
              ((account.installment_amount > 0 &&
                account.installment_total_months > 0 &&
                account.installment_month < account.installment_total_months) ||
                (account.installment_amount <= 0 && Boolean(account.nextSchedule)));
            const payAmount =
              account.installment_amount > 0
                ? account.installment_amount
                : (account.nextSchedule?.amount_due ?? 0);
            const payInstallmentLabel =
              account.installment_total_months > 0
                ? `ke-${account.installment_month + 1} dari ${account.installment_total_months}`
                : account.nextSchedule
                  ? `jadwal ${formatDebtDate(account.nextSchedule.due_date)}`
                  : "berikutnya";

            return (
              <Card
                key={account.id}
                className="space-y-4 border-[#e8e1d4] bg-[#fffdf9] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl text-ink">
                      {account.creditor_name}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {TYPE_LABELS[account.account_type]}
                      {account.reference_label
                        ? ` · ${account.reference_label}`
                        : ""}
                      {account.installment_total_months > 0
                        ? ` · ${account.installment_month}/${account.installment_total_months} bulan`
                        : ""}
                      {account.installment_amount > 0
                        ? ` · ${formatRupiah(account.installment_amount)}/bulan`
                        : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(account.status)}>
                    {STATUS_LABELS[account.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#f8f4ec] p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Total kontrak
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {formatRupiah(account.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Cicilan per bulan
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {account.installment_amount > 0
                        ? formatRupiah(account.installment_amount)
                        : account.nextSchedule
                          ? "Bervariasi"
                          : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Sisa
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {formatRupiah(account.remaining)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-ink-soft">
                    <span>
                      Dibayar {formatRupiah(account.paid)} · {account.progress}%
                    </span>
                    <span
                      className={
                        overdue ? "font-medium text-rose-700" : "text-ink-soft"
                      }
                    >
                      {dueDate
                        ? overdue
                          ? `Terlambat ${Math.abs(dueDays ?? 0)} hari`
                          : account.due_day
                            ? `Tanggal ${account.due_day} · jatuh tempo ${formatDebtDate(dueDate)}`
                            : `Jatuh tempo ${formatDebtDate(dueDate)}`
                        : "Tanpa jatuh tempo"}
                    </span>
                  </div>
                  <Progress value={account.progress} tone="olive" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-olive-100 pt-3">
                  <div className="flex items-center gap-1 text-xs text-ink-soft">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Dibuka {formatDebtDate(account.opening_date)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canPay ? (
                      <ConfirmAction
                        action={payDebtInstallmentAction}
                        fields={{ id: account.id }}
                        label="Bayar angsuran"
                        confirmLabel={`Bayar ${formatRupiah(payAmount)}`}
                        message={`Catat angsuran ${payInstallmentLabel}. Jatuh tempo akan maju satu bulan dan sisa berkurang.`}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(account)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </button>
                    <ConfirmAction
                      action={deleteDebtAccountAction}
                      fields={{ id: account.id }}
                      label="Hapus / tutup"
                      confirmLabel="Ya, lanjutkan"
                      message="Jika akun sudah memiliki pembayaran atau jadwal, akun akan ditutup dan seluruh riwayat tetap disimpan."
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FormModal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing?.id ? "Edit akun utang" : "Tambah akun utang"}
        wide
      >
        <DebtAccountForm
          key={editing?.id ?? "new"}
          account={editing ?? undefined}
          onDone={() => setEditing(undefined)}
        />
      </FormModal>
    </div>
  );
}
