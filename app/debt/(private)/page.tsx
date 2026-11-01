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
  buildAccountSummaries,
  buildInstallments,
  calculateDebtTotals,
} from "@/lib/debt/calculations";
import { formatDebtDate, formatRupiah, todayISO } from "@/lib/debt/format";

export const metadata = { title: "Ringkasan" };

const STATUS_LABELS = {
  upcoming: "Akan datang",
  unpaid: "Belum dibayar",
  partially_paid: "Dibayar sebagian",
  paid: "Lunas",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
} as const;

export default async function DebtDashboardPage() {
  const owner = await requireDebtOwner();
  const supabase = await createDebtClient();
  const data = await loadDebtData(supabase, owner.userId);
  const today = todayISO();
  const openAccounts = data.accounts.filter(
    (account) => account.status !== "closed",
  );
  const summaries = buildAccountSummaries(
    openAccounts,
    data.payments,
    data.schedules,
    today,
  );
  const totals = calculateDebtTotals(
    data.accounts,
    data.payments,
    data.schedules,
    today,
  );
  const installments = buildInstallments(
    openAccounts,
    data.schedules,
    data.payments,
    today,
  ).filter((item) => item.status !== "cancelled" && item.remaining > 0);
  const nextInstallments = installments.slice(0, 5);
  const recentAccounts = summaries.slice(0, 3);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Ringkasan utang"
        subtitle="Gambaran tenang tentang apa yang sudah dibayar, apa yang tersisa, dan angsuran mana yang perlu disiapkan berikutnya."
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
          label="Total utang"
          value={formatRupiah(totals.originalTotal)}
          hint="Utang awal, atau total angsuran jika utang awal dikosongkan"
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
          label="Sisa tagihan"
          value={formatRupiah(totals.remaining)}
          hint="Jumlah sisa seluruh angsuran"
          icon={<TrendingDown className="size-4" aria-hidden />}
          tone="neutral"
        />
        <StatCard
          label="Terlambat"
          value={String(totals.overdueCount)}
          hint={
            totals.overdueAmount > 0
              ? `${formatRupiah(totals.overdueAmount)} perlu segera diselesaikan`
              : "Tidak ada angsuran terlambat"
          }
          icon={<CircleAlert className="size-4" aria-hidden />}
        />
        <StatCard
          label="Jatuh tempo 7 hari"
          value={String(totals.dueSoonCount)}
          hint={
            totals.dueSoonCount > 0
              ? "Angsuran yang perlu disiapkan"
              : "Tidak ada angsuran minggu ini"
          }
          icon={<CalendarClock className="size-4" aria-hidden />}
          tone="champagne"
        />
        <StatCard
          label="Target bulan ini"
          value={formatRupiah(totals.monthlyTarget)}
          hint={`Pembayaran tercatat bulan ini ${formatRupiah(totals.monthlyPaid)}`}
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
              {formatRupiah(totals.totalPaid + totals.remaining)}
            </p>
            <div className="mt-4">
              <Progress value={totals.progress} tone="olive" />
            </div>
          </div>
        </Card>
      </section>

      <Card className="border-[#e8e1d4] bg-[#fffdf9]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-ink">
              Angsuran berikutnya
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Tagihan terdekat dari setiap jadwal angsuran.
            </p>
          </div>
          <Link
            href="/debt/schedule"
            className="text-xs font-medium text-olive-700 hover:underline"
          >
            Lihat jadwal
          </Link>
        </div>

        {nextInstallments.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Belum ada angsuran"
              body="Tambahkan angsuran pada setiap utang agar sisa dan jatuh tempo bisa dihitung."
              icon={<CalendarClock className="size-8" aria-hidden />}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nextInstallments.map((item) => (
              <div
                key={item.schedule.id}
                className="rounded-2xl border border-olive-100 bg-[#f8f4ec] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">
                    {item.account.creditor_name}
                  </p>
                  <Badge
                    tone={
                      item.status === "overdue"
                        ? "blush"
                        : item.status === "partially_paid"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {item.account.reference_label
                    ? `${item.account.reference_label} · `
                    : ""}
                  {formatDebtDate(item.schedule.due_date)}
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {formatRupiah(item.remaining)}
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Tagihan {formatRupiah(item.schedule.amount_due)}
                  {item.paid > 0 ? ` · dibayar ${formatRupiah(item.paid)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[#e8e1d4] bg-[#fffdf9]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl text-ink">Utang terbaru</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Ringkasan utang yang sedang dipantau.
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
                title="Belum ada utang"
                body="Tambahkan utang pertama untuk melihat sisa dan progresnya."
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
                      {account.nextInstallment
                        ? `Angsuran berikutnya ${formatDebtDate(account.nextInstallment.schedule.due_date)}`
                        : "Semua angsuran lunas"}
                      {` · ${account.paidInstallments}/${account.installmentCount} lunas`}
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
              <h2 className="font-heading text-xl text-ink">Tagihan jatuh tempo</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Angsuran yang jatuh tempo hari ini atau sudah lewat.
              </p>
            </div>
          </div>

          {installments.filter((item) => item.schedule.due_date <= today).length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Tidak ada tagihan tertunggak"
                body="Semua angsuran yang sudah lewat tanggalnya telah dibayar."
                icon={<CalendarClock className="size-8" aria-hidden />}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {installments
                .filter((item) => item.schedule.due_date <= today)
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.schedule.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f4ec] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {item.account.creditor_name}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {formatDebtDate(item.schedule.due_date)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-ink">
                      {formatRupiah(item.remaining)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
