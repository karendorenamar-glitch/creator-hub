"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import {
  createDebtScheduleAction,
  createDebtScheduleBatchAction,
  deleteDebtScheduleAction,
  payDebtInstallmentAction,
  updateDebtScheduleAction,
  updateDebtScheduleStatusAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { Badge, Card, EmptyState } from "@/components/wedding/ui";
import { ConfirmAction } from "@/components/debt/confirm-action";
import { FormModal } from "@/components/wedding/form-modal";
import type {
  AccountSummary,
  Installment,
  InstallmentStatus,
  MonthCounts,
} from "@/lib/debt/calculations";
import {
  addMonthsISO,
  formatDebtDate,
  formatRupiah,
  monthLabel,
  todayISO,
} from "@/lib/debt/format";

const STATUS_LABELS: Record<InstallmentStatus, string> = {
  upcoming: "Akan datang",
  unpaid: "Belum dibayar",
  partially_paid: "Dibayar sebagian",
  paid: "Lunas",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
};

function statusTone(status: InstallmentStatus) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "blush" as const;
  if (status === "cancelled") return "muted" as const;
  if (status === "upcoming") return "neutral" as const;
  return "warning" as const;
}

function ScheduleForm({
  accounts,
  defaultAccountId,
  onDone,
}: {
  accounts: AccountSummary[];
  defaultAccountId: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    createDebtScheduleAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state?.success, onDone]);

  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state?.error} />
      <Field label="Utang" htmlFor="scheduleAccount">
        <select
          id="scheduleAccount"
          name="debtAccountId"
          required
          defaultValue={defaultAccountId}
          className={inputClass}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.creditor_name}
              {account.reference_label ? ` · ${account.reference_label}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jatuh tempo" htmlFor="scheduleDueDate">
          <input
            id="scheduleDueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={todayISO()}
            className={inputClass}
          />
        </Field>
        <Field label="Nominal angsuran (IDR)" htmlFor="scheduleAmount">
          <input
            id="scheduleAmount"
            name="amountDue"
            required
            inputMode="numeric"
            placeholder="Contoh: 500.000"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Catatan" htmlFor="scheduleNotes">
        <input
          id="scheduleNotes"
          name="notes"
          maxLength={2000}
          placeholder="Opsional"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Menyimpan…" : "Simpan angsuran"}
      </button>
    </form>
  );
}

function BatchForm({
  accounts,
  defaultAccountId,
  month,
  onDone,
}: {
  accounts: AccountSummary[];
  defaultAccountId: string;
  month: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    createDebtScheduleBatchAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state?.success, onDone]);

  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state?.error} />
      <Field label="Utang" htmlFor="batchAccount">
        <select
          id="batchAccount"
          name="debtAccountId"
          required
          defaultValue={defaultAccountId}
          className={inputClass}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.creditor_name}
              {account.reference_label ? ` · ${account.reference_label}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mulai bulan" htmlFor="batchMonth">
          <input
            id="batchMonth"
            name="startMonth"
            type="month"
            required
            defaultValue={month}
            className={inputClass}
          />
        </Field>
        <Field label="Tanggal" htmlFor="batchDay">
          <input
            id="batchDay"
            name="dueDay"
            type="number"
            min={1}
            max={31}
            required
            defaultValue={3}
            className={inputClass}
          />
        </Field>
        <Field label="Jumlah" htmlFor="batchCount">
          <input
            id="batchCount"
            name="count"
            type="number"
            min={1}
            max={60}
            required
            defaultValue={6}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Nominal per angsuran (IDR)" htmlFor="batchAmount">
        <input
          id="batchAmount"
          name="amountDue"
          required
          inputMode="numeric"
          placeholder="Bisa diubah satu per satu setelah dibuat"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Membuat…" : "Buat angsuran bulanan"}
      </button>
    </form>
  );
}

function EditScheduleForm({
  item,
  onDone,
}: {
  item: Installment;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<DebtActionResult, FormData>(
    updateDebtScheduleAction,
    null,
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state?.success, onDone]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={item.schedule.id} />
      <FormAlert error={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jatuh tempo" htmlFor="editDueDate">
          <input
            id="editDueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={item.schedule.due_date}
            className={inputClass}
          />
        </Field>
        <Field label="Nominal (IDR)" htmlFor="editAmount">
          <input
            id="editAmount"
            name="amountDue"
            required
            inputMode="numeric"
            defaultValue={String(item.schedule.amount_due)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Catatan" htmlFor="editNotes">
        <input
          id="editNotes"
          name="notes"
          maxLength={2000}
          defaultValue={item.schedule.notes ?? ""}
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}

export function DebtScheduleManager({
  month,
  installments,
  counts,
  summary,
  accounts,
  selectedAccountId,
}: {
  month: string;
  installments: Installment[];
  counts: MonthCounts;
  summary: { scheduled: number; paid: number; remaining: number };
  accounts: AccountSummary[];
  selectedAccountId: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [editing, setEditing] = useState<Installment | null>(null);
  const defaultAccountId = selectedAccountId || accounts[0]?.id || "";
  const previousMonth = addMonthsISO(`${month}-01`, -1).slice(0, 7);
  const nextMonth = addMonthsISO(`${month}-01`, 1).slice(0, 7);

  return (
    <div className="space-y-5">
      <Card className="space-y-4 border-[#e8e1d4] bg-[#fffdf9] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/debt/schedule?month=${previousMonth}${selectedAccountId ? `&account=${selectedAccountId}` : ""}`}
              className="rounded-lg border border-olive-100 p-2 text-ink-soft hover:bg-olive-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
            <p className="min-w-[9rem] text-center font-heading text-lg text-ink">
              {monthLabel(month)}
            </p>
            <Link
              href={`/debt/schedule?month=${nextMonth}${selectedAccountId ? `&account=${selectedAccountId}` : ""}`}
              className="rounded-lg border border-olive-100 p-2 text-ink-soft hover:bg-olive-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          <form action="/debt/schedule" method="get" className="flex flex-wrap items-end gap-2">
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-xl border border-olive-100 bg-white px-3 py-2 text-sm text-ink"
              aria-label="Pilih bulan"
            />
            <select
              name="account"
              defaultValue={selectedAccountId}
              className="rounded-xl border border-olive-100 bg-white px-3 py-2 text-sm text-ink"
              aria-label="Filter utang"
            >
              <option value="">Semua utang</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.creditor_name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl border border-olive-200 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-olive-50"
            >
              Tampilkan
            </button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f8f4ec] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Tagihan bulan ini
            </p>
            <p className="mt-1 font-medium text-ink">
              {formatRupiah(summary.scheduled)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f8f4ec] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Dibayar bulan ini
            </p>
            <p className="mt-1 font-medium text-ink">
              {formatRupiah(summary.paid)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f8f4ec] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Sisa bulan ini
            </p>
            <p className="mt-1 font-medium text-ink">
              {formatRupiah(summary.remaining)}
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-soft">
          {counts.paid} lunas · {counts.partially_paid} dibayar sebagian ·{" "}
          {counts.unpaid} belum dibayar · {counts.overdue} terlambat ·{" "}
          {counts.upcoming} akan datang
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={accounts.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden /> Tambah angsuran
        </button>
        <button
          type="button"
          onClick={() => setShowBatch(true)}
          disabled={accounts.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-olive-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-olive-50 disabled:opacity-60"
        >
          <CalendarClock className="size-4" aria-hidden /> Buat beberapa angsuran
        </button>
      </div>

      {installments.length === 0 ? (
        <EmptyState
          title="Belum ada angsuran di bulan ini"
          body="Tambahkan angsuran dengan tanggal dan nominal yang bisa berbeda tiap bulan."
          icon={<CalendarClock className="size-8" aria-hidden />}
        />
      ) : (
        <div className="space-y-3">
          {installments.map((item) => {
            const canPay = item.remaining > 0 && item.status !== "cancelled";
            const canEdit = item.paid === 0 && item.status !== "cancelled";
            return (
              <Card
                key={item.schedule.id}
                className={`border-[#e8e1d4] p-4 ${
                  item.status === "cancelled"
                    ? "bg-[#fbf8f3] opacity-75"
                    : "bg-[#fffdf9]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg text-ink">
                        {formatRupiah(item.schedule.amount_due)}
                      </p>
                      <Badge tone={statusTone(item.status)}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {item.account.creditor_name}
                      {item.account.reference_label
                        ? ` · ${item.account.reference_label}`
                        : ""}{" "}
                      · {formatDebtDate(item.schedule.due_date)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      Dibayar {formatRupiah(item.paid)} · sisa{" "}
                      {formatRupiah(item.remaining)}
                    </p>
                    {item.schedule.notes ? (
                      <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-soft">
                        {item.schedule.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {canPay ? (
                      <ConfirmAction
                        action={payDebtInstallmentAction}
                        fields={{ id: item.schedule.id }}
                        label="Bayar penuh"
                        confirmLabel={`Bayar ${formatRupiah(item.remaining)}`}
                        message="Pembayaran penuh dicatat untuk angsuran ini. Riwayat tetap tersimpan."
                      />
                    ) : null}
                    {canPay ? (
                      <Link
                        href={`/debt/payments?account=${item.account.id}&schedule=${item.schedule.id}`}
                        className="rounded-lg px-2 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50"
                      >
                        Bayar sebagian
                      </Link>
                    ) : null}
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-olive-700 hover:bg-olive-50"
                      >
                        <Pencil className="size-3.5" aria-hidden /> Edit
                      </button>
                    ) : null}
                    {item.status !== "cancelled" && item.paid === 0 ? (
                      <ConfirmAction
                        action={updateDebtScheduleStatusAction}
                        fields={{ id: item.schedule.id, status: "cancelled" }}
                        label="Batalkan"
                        confirmLabel="Ya, batalkan"
                        message="Angsuran akan ditandai dibatalkan dan tidak dihitung sebagai tagihan."
                        tone="neutral"
                      />
                    ) : null}
                    {item.status === "cancelled" ? (
                      <ConfirmAction
                        action={updateDebtScheduleStatusAction}
                        fields={{ id: item.schedule.id, status: "upcoming" }}
                        label="Aktifkan lagi"
                        confirmLabel="Ya, aktifkan"
                        message="Angsuran akan dihitung kembali sebagai tagihan."
                        tone="neutral"
                      />
                    ) : null}
                    {item.paid === 0 ? (
                      <ConfirmAction
                        action={deleteDebtScheduleAction}
                        fields={{ id: item.schedule.id }}
                        label="Hapus"
                        confirmLabel="Ya, hapus"
                        message="Angsuran tanpa pembayaran akan dihapus permanen."
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Tambah angsuran"
      >
        <ScheduleForm
          accounts={accounts}
          defaultAccountId={defaultAccountId}
          onDone={() => setShowAdd(false)}
        />
      </FormModal>

      <FormModal
        open={showBatch}
        onClose={() => setShowBatch(false)}
        title="Buat beberapa angsuran"
      >
        <BatchForm
          accounts={accounts}
          defaultAccountId={defaultAccountId}
          month={month}
          onDone={() => setShowBatch(false)}
        />
      </FormModal>

      <FormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit angsuran"
      >
        {editing ? (
          <EditScheduleForm item={editing} onDone={() => setEditing(null)} />
        ) : null}
      </FormModal>
    </div>
  );
}
