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
import type { AccountSummary } from "@/lib/debt/calculations";
import {
  deleteDebtAccountAction,
  materializeLegacySchedulesAction,
  payDebtInstallmentAction,
} from "@/app/debt/actions";
import { daysUntil, formatDebtDate, formatRupiah } from "@/lib/debt/format";
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

function statusTone(status: AccountSummary["status"]) {
  if (status === "paid") return "success" as const;
  if (status === "closed") return "muted" as const;
  return "warning" as const;
}

export function DebtAccountManager({
  accounts,
}: {
  accounts: AccountSummary[];
}) {
  const [editing, setEditing] = useState<AccountSummary | null | undefined>(
    undefined,
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AccountSummary["status"]>("all");
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
      const dueDate = account.nextInstallment?.schedule.due_date ?? null;
      if (!dueDate || account.remaining <= 0) return false;
      const days = daysUntil(dueDate);
      if (due === "overdue") return account.overdueInstallments > 0;
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
            <Plus className="size-4" aria-hidden /> Tambah utang
          </button>
          <Link
            href="/debt/payments"
            className="inline-flex items-center gap-2 rounded-xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-olive-50"
          >
            <WalletCards className="size-4" aria-hidden /> Catat pembayaran
          </Link>
          {accounts.some((account) => account.legacy) ? (
            <ConfirmAction
              action={materializeLegacySchedulesAction}
              fields={{}}
              label="Buat angsuran dari tenor lama"
              confirmLabel="Ya, buat angsuran"
              message="Semua utang yang masih memakai tenor lama akan dibuatkan jadwal angsuran. Utang yang sudah punya jadwal dilewati."
              tone="neutral"
            />
          ) : null}
        </div>
        <span className="text-xs text-ink-soft">
          {filtered.length} dari {accounts.length} akun
        </span>
      </div>

      <Card className="space-y-3 border-[#e8e1d4] bg-[#fffdf9] p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-soft"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari utang, kreditur, atau label…"
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
          title={accounts.length === 0 ? "Belum ada utang" : "Tidak ada hasil"}
          body={
            accounts.length === 0
              ? "Tambahkan utang pertama, lalu susun angsuran bulanannya."
              : "Coba ubah kata kunci atau filter."
          }
          icon={<WalletCards className="size-8" aria-hidden />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((account) => {
            const next = account.nextInstallment;
            const nextDate = next?.schedule.due_date ?? null;
            const days = nextDate ? daysUntil(nextDate) : null;
            const overdue =
              account.status === "active" && account.overdueInstallments > 0;
            const canPay =
              account.status === "active" &&
              next !== null &&
              next.remaining > 0 &&
              next.schedule.id !== "";

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
                      {` · ${account.installmentCount} angsuran`}
                    </p>
                  </div>
                  <Badge tone={statusTone(account.status)}>
                    {STATUS_LABELS[account.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#f8f4ec] p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Utang awal
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {formatRupiah(account.original)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Sudah dibayar
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {formatRupiah(account.paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      Sisa tagihan
                    </p>
                    <p className="mt-1 font-medium text-ink">
                      {formatRupiah(account.remaining)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                    <span>
                      {account.paidInstallments} lunas ·{" "}
                      {account.openInstallments} belum lunas
                    </span>
                    <span
                      className={
                        overdue ? "font-medium text-rose-700" : "text-ink-soft"
                      }
                    >
                      {account.legacy
                        ? "Masih memakai tenor lama"
                        : account.installmentCount === 0
                          ? "Belum ada angsuran"
                          : nextDate
                            ? overdue && account.overdueInstallments > 0
                              ? `${account.overdueInstallments} angsuran terlambat`
                              : days !== null && days < 0
                                ? `${Math.abs(days)} hari lalu`
                                : `Berikutnya ${formatDebtDate(nextDate)}`
                            : "Semua angsuran lunas"}
                    </span>
                  </div>
                  <Progress value={account.progress} tone="olive" />
                </div>

                {account.legacy ? (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <p>
                      Angka di atas dihitung dari tenor lama (Rp{" "}
                      {formatRupiah(account.installment_amount)} ×{" "}
                      {account.installment_total_months} bulan). Buat angsuran agar
                      bisa dibayar per bulan.
                    </p>
                    <ConfirmAction
                      action={materializeLegacySchedulesAction}
                      fields={{ id: account.id }}
                      label="Buat angsuran dari tenor"
                      confirmLabel="Ya, buat"
                      message="Jadwal angsuran akan dibuat dari sisa tenor utang ini."
                      tone="neutral"
                    />
                  </div>
                ) : null}

                {account.mismatch ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Total angsuran {formatRupiah(account.scheduled)} berbeda dengan
                    utang awal {formatRupiah(account.original)}. Sisa dan progres
                    mengikuti angsuran yang tercatat.
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-olive-100 pt-3">
                  <div className="flex items-center gap-1 text-xs text-ink-soft">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Mulai {formatDebtDate(account.opening_date)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canPay ? (
                      <ConfirmAction
                        action={payDebtInstallmentAction}
                        fields={{ id: next.schedule.id }}
                        label="Bayar angsuran"
                        confirmLabel={`Bayar ${formatRupiah(next.remaining)}`}
                        message={`Catat pelunasan angsuran ${formatDebtDate(nextDate)} sebesar ${formatRupiah(next.remaining)}.`}
                      />
                    ) : null}
                    <Link
                      href={`/debt/schedule?account=${account.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50"
                    >
                      Atur angsuran
                    </Link>
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
                      message="Jika utang sudah memiliki angsuran atau pembayaran, utang akan ditutup dan seluruh riwayat tetap disimpan."
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
        title={editing ? "Edit utang" : "Tambah utang"}
      >
        {editing !== undefined ? (
          <DebtAccountForm
            account={editing ?? undefined}
            onDone={() => setEditing(undefined)}
          />
        ) : null}
      </FormModal>
    </div>
  );
}
