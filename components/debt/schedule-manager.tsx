"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import {
  createDebtScheduleAction,
  updateDebtScheduleStatusAction,
  type DebtActionResult,
} from "@/app/debt/actions";
import { Field, FormAlert, inputClass } from "@/components/wedding/form-kit";
import { Badge, Card, EmptyState } from "@/components/wedding/ui";
import { ConfirmAction } from "@/components/debt/confirm-action";
import type { AccountBalance } from "@/lib/debt/calculations";
import type { DebtSchedule } from "@/lib/debt/db-types";
import { daysUntil, formatDebtDate, formatRupiah } from "@/lib/debt/format";

const STATUS_LABELS = {
  upcoming: "Akan datang",
  paid: "Lunas",
  cancelled: "Dibatalkan",
} as const;

function scheduleTone(status: DebtSchedule["status"]) {
  if (status === "paid") return "success" as const;
  if (status === "cancelled") return "muted" as const;
  return "warning" as const;
}

export function DebtScheduleManager({
  schedules,
  accounts,
  today,
}: {
  schedules: DebtSchedule[];
  accounts: AccountBalance[];
  today: string;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [status, setStatus] = useState<"all" | DebtSchedule["status"]>("all");
  const [showForm, setShowForm] = useState(schedules.length === 0);
  const [state, action, pending] = useActionState<
    DebtActionResult,
    FormData
  >(createDebtScheduleAction, null);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.creditor_name])),
    [accounts],
  );
  const filtered = useMemo(
    () =>
      schedules.filter((schedule) => {
        if (status !== "all" && schedule.status !== status) return false;
        return true;
      }),
    [schedules, status],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
        >
          <Plus className="size-4" aria-hidden /> {showForm ? "Tutup form" : "Tambah jadwal"}
        </button>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["all", "upcoming", "paid", "cancelled"] as const).map((value) => (
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
              {value === "all" ? "Semua" : STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {showForm ? (
        <Card className="border-[#e8e1d4] bg-[#fffdf9]">
          <form action={action} className="space-y-4">
            <div>
              <h2 className="font-heading text-xl text-ink">Tambah jadwal</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Jadwal membantu melihat tagihan yang akan datang. Status lunas
                berubah otomatis hanya jika pembayaran dihubungkan ke jadwal ini.
              </p>
            </div>
            <FormAlert error={state?.error} success={state?.success} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Akun utang" htmlFor="scheduleAccount">
                <select
                  id="scheduleAccount"
                  name="debtAccountId"
                  required
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className={inputClass}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.creditor_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Jatuh tempo" htmlFor="scheduleDueDate">
                <input
                  id="scheduleDueDate"
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClass}
                />
              </Field>
              <Field label="Nominal (IDR)" htmlFor="scheduleAmount">
                <input
                  id="scheduleAmount"
                  name="amountDue"
                  required
                  inputMode="numeric"
                  placeholder="0"
                  className={inputClass}
                />
              </Field>
              <Field label="Catatan" htmlFor="scheduleNotes">
                <input
                  id="scheduleNotes"
                  name="notes"
                  maxLength={2000}
                  placeholder="Opsional"
                  className={inputClass}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={pending || accounts.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? "Menyimpan…" : "Simpan jadwal"}
            </button>
          </form>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          body="Tambahkan tanggal cicilan atau tagihan yang akan datang."
          icon={<CalendarClock className="size-8" aria-hidden />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((schedule) => {
            const days = daysUntil(schedule.due_date);
            const overdue = schedule.status === "upcoming" && days < 0;
            return (
              <Card
                key={schedule.id}
                className={`border-[#e8e1d4] p-4 ${
                  schedule.status === "cancelled"
                    ? "bg-[#fbf8f3] opacity-75"
                    : "bg-[#fffdf9]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg text-ink">
                        {formatRupiah(schedule.amount_due)}
                      </p>
                      <Badge tone={scheduleTone(schedule.status)}>
                        {STATUS_LABELS[schedule.status]}
                      </Badge>
                      {overdue ? <Badge tone="warning">Terlambat</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {accountNames.get(schedule.debt_account_id) ?? "Akun"} ·{" "}
                      {formatDebtDate(schedule.due_date)}
                      {schedule.status === "upcoming"
                        ? days < 0
                          ? ` · ${Math.abs(days)} hari lalu`
                          : ` · ${days} hari lagi`
                        : ""}
                    </p>
                    {schedule.notes ? (
                      <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-soft">
                        {schedule.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {schedule.status === "upcoming" ? (
                      <ConfirmAction
                        action={updateDebtScheduleStatusAction}
                        fields={{ id: schedule.id, status: "cancelled" }}
                        label="Batalkan"
                        confirmLabel="Ya, batalkan"
                        message="Jadwal akan ditandai dibatalkan. Riwayat pembayaran tidak berubah."
                        tone="neutral"
                      />
                    ) : null}
                    {schedule.status === "cancelled" ? (
                      <ConfirmAction
                        action={updateDebtScheduleStatusAction}
                        fields={{ id: schedule.id, status: "upcoming" }}
                        label="Aktifkan lagi"
                        confirmLabel="Ya, aktifkan"
                        message="Jadwal akan kembali berstatus akan datang."
                        tone="neutral"
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
