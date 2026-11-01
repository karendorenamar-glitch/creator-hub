import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  CircleDollarSign,
  HandCoins,
  Landmark,
  Target,
  TrendingDown,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/wedding/ui";
import { requireDebtOwner } from "@/lib/debt/auth";
import { createDebtClient } from "@/lib/debt/supabase";
import { loadDebtData } from "@/lib/debt/queries";
import {
  buildAccountBalances,
  calculateDebtTotals,
} from "@/lib/debt/calculations";
import {
  formatDebtDate,
  formatRupiah,
  monthLabel,
  todayISO,
} from "@/lib/debt/format";

export const metadata = { title: "Ringkasan" };

export default async function DebtDashboardPage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const balances = buildAccountBalances(data.accounts, data.payments);
  const today = todayISO();
  const totals = calculateDebtTotals(
    data.accounts,
    data.payments,
    data.schedules,
    today,
  );
  const accountNames = new Map(
    data.accounts.map((account) => [account.id, account.creditor_name]),
  );
  const recentAccounts = balances
    .filter((account) => account.status !== "closed")
    .slice(0, 3);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Ringkasan utang"
        subtitle="Gambaran tenang tentang apa yang sudah dibayar, apa yang tersisa, dan apa yang perlu disiapkan berikutnya."
        action={
          <Link
            href="/debt/payments"
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            Catat pembayaran <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total utang awal"
          value={formatRupiah(totals.originalTotal)}
          hint="Total kontrak dari akun yang belum ditutup"
          icon={<Landmark className="size-4" aria-hidden />}
        />
        <StatCard
          label="Sudah dibayar"
          value={formatRupiah(totals.totalPaid)}
          hint="Pembayaran aktif, tanpa transaksi yang dibatalkan"
          icon={<HandCoins className="size-4" aria-hidden />}
          tone="champagne"
        />
        <StatCard
          label="Sisa saldo"
          value={formatRupiah(totals.remaining)}
          hint="Tidak pernah ditampilkan negatif"
          icon={<TrendingDown className="size-4" aria-hidden />}
          tone="neutral"
        />
        <StatCard
          label="Akun terlambat"
          value={String(totals.overdueCount)}
          hint={
            totals.overdueCount > 0
              ? "Perlu perhatian segera"
              : "Tidak ada akun terlambat"
          }
          icon={<CircleAlert className="size-4" aria-hidden />}
        />
        <StatCard
          label="Jatuh tempo 7 hari"
          value={String(totals.dueSoonCount)}
          hint={
            totals.dueSoonCount > 0
              ? "Tagihan yang perlu disiapkan"
              : "Tidak ada tagihan minggu ini"
          }
          icon={<CalendarClock className="size-4" aria-hidden />}
          tone="champagne"
        />
        <StatCard
          label="Target bulan ini"
          value={formatRupiah(totals.monthlyTarget)}
          hint={`${monthLabel(totals.monthlyLabelKey)} · terbayar ${formatRupiah(totals.monthlyPaid)}`}
          icon={<Target className="size-4" aria-hidden />}
          tone="neutral"
        />
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              Progres pembayaran
            </p>
            <span className="rounded-full bg-olive-100 p-2 text-olive-700">
              <CircleDollarSign className="size-4" aria-hidden />
            </span>
          </div>
          <div>
            <p className="font-heading text-2xl text-ink">{totals.progress}%</p>
            <p className="mt-1 text-xs text-ink-soft">
              {formatRupiah(totals.totalPaid)} dari{" "}
              {formatRupiah(totals.originalTotal)}
            </p>
            <div className="mt-4">
              <Progress value={totals.progress} tone="olive" />
            </div>
          </div>
        </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[#e8e1d4] bg-[#fffdf9]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl text-ink">Akun terbaru</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Ringkasan akun yang sedang dipantau.
              </p>
            </div>
            <Link
              href="/debt/accounts"
              className="text-xs font-medium text-olive-700 hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {recentAccounts.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Belum ada akun utang"
                body="Tambahkan akun pertama untuk melihat saldo dan progresnya."
                icon={<Landmark className="size-8" aria-hidden />}
              />
            </div>
          ) : (
            <div className="mt-4 divide-y divide-olive-100">
              {recentAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-ink">{account.creditor_name}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {account.due_date
                        ? `Jatuh tempo ${formatDebtDate(account.due_date)}`
                        : "Tanpa tanggal jatuh tempo"}
                    </p>
                  </div>
                  <div className="min-w-40 text-right">
                    <p className="text-sm font-medium text-ink">
                      {formatRupiah(account.remaining)}
                    </p>
                    <div className="mt-2">
                      <Progress value={account.progress} tone="olive" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-[#e8e1d4] bg-[#fffdf9]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl text-ink">Jadwal terdekat</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Tagihan dalam tujuh hari ke depan.
              </p>
            </div>
            <Link
              href="/debt/schedule"
              className="text-xs font-medium text-olive-700 hover:underline"
            >
              Lihat jadwal
            </Link>
          </div>

          {totals.dueSoonSchedules.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Minggu ini tenang"
                body="Tidak ada jadwal yang jatuh tempo dalam tujuh hari ke depan."
                icon={<CalendarClock className="size-8" aria-hidden />}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {totals.dueSoonSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f4ec] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {accountNames.get(schedule.debt_account_id) ?? "Akun"}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {formatDebtDate(schedule.due_date)}
                    </p>
                  </div>
                  <Badge tone="warning">
                    {formatRupiah(schedule.amount_due)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {totals.overdueAccounts.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
              <CircleAlert className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-lg text-amber-950">
                Perlu perhatian
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                {totals.overdueAccounts.length} akun sudah melewati tanggal jatuh
                tempo. Tinjau akun atau catat pembayaran agar statusnya terbarui.
              </p>
              <Link
                href="/debt/accounts"
                className="mt-3 inline-flex text-sm font-medium text-amber-900 underline underline-offset-4"
              >
                Buka akun utang
              </Link>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
