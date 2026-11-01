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
  calculateDebtTotals,
} from "@/lib/debt/calculations";
import { formatDebtDate, formatRupiah, todayISO } from "@/lib/debt/format";
import { MarkPaidButton } from "@/components/debt/mark-paid-button";

export const metadata = { title: "Ringkasan" };
export const dynamic = "force-dynamic";

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
  const currentMonth = today.slice(0, 7);
  const paidThisMonth = new Map<string, number>();
  for (const payment of data.payments) {
    if (payment.reversed_at) continue;
    if (!payment.payment_date.startsWith(currentMonth)) continue;
    paidThisMonth.set(
      payment.debt_account_id,
      (paidThisMonth.get(payment.debt_account_id) ?? 0) + Number(payment.amount),
    );
  }
  const isSettledThisMonth = (account: (typeof summaries)[number]) => {
    const paid = paidThisMonth.get(account.id) ?? 0;
    if (paid <= 0) return false;
    const before = account.remaining + paid;
    const target =
      account.installment_amount > 0
        ? Math.min(account.installment_amount, before)
        : before;
    return paid >= target;
  };
  const unpaidAccounts = summaries.filter(
    (account) => account.remaining > 0 && Boolean(account.due_date),
  );
  const upcoming = unpaidAccounts
    .filter((account) => !isSettledThisMonth(account))
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 5);
  const dueSoonAccounts = unpaidAccounts
    .filter((account) => {
      if (isSettledThisMonth(account)) return false;
      const due = String(account.due_date);
      const days = Math.round(
        (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
          86_400_000,
      );
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const late = summaries.filter(
    (account) =>
      account.remaining > 0 &&
      Boolean(account.due_date) &&
      String(account.due_date) < today,
  );
  const recentAccounts = summaries.slice(0, 3);

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-olive-200 bg-[#f3efe3] px-4 py-3 text-center">
        <p className="font-heading text-[13px] leading-relaxed tracking-wide text-olive-800 sm:text-sm">
          KAREN BISA TANPA GALBAY · YOK SEMANGAT 1M PERTAMA BY THE END OF 2026
        </p>
      </div>

      <PageHeader
        title="Ringkasan utang"
        subtitle="Gambaran tenang tentang apa yang sudah dibayar, apa yang tersisa, dan tagihan mana yang perlu disiapkan berikutnya."
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
          hint="Nominal per bulan x total tenor"
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
          hint="Tidak pernah ditampilkan negatif"
          icon={<TrendingDown className="size-4" aria-hidden />}
          tone="neutral"
        />
        <StatCard
          label="Terlambat"
          value={String(totals.overdueCount)}
          hint={
            totals.overdueAmount > 0
              ? `${formatRupiah(totals.overdueAmount)} perlu disiapkan`
              : "Tidak ada tagihan terlambat"
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
            <h2 className="font-heading text-xl text-ink">Jatuh tempo 7 hari</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Klik bayar langsung dari sini. Kartu hilang setelah dibayar.
            </p>
          </div>
          <Badge tone={dueSoonAccounts.length > 0 ? "warning" : "muted"}>
            {dueSoonAccounts.length} tagihan
          </Badge>
        </div>

        {dueSoonAccounts.length === 0 ? (
          <p className="mt-4 rounded-xl bg-[#f8f4ec] px-3 py-2.5 text-xs text-ink-soft">
            Tidak ada tagihan dalam 7 hari ke depan.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueSoonAccounts.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border border-olive-100 bg-[#f8f4ec] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{account.creditor_name}</p>
                  <Badge
                    tone={account.overdueInstallments > 0 ? "blush" : "warning"}
                  >
                    {account.overdueInstallments > 0 ? "Terlambat" : "Segera"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatDebtDate(account.due_date)} ·{" "}
                  {account.installment_month}/{account.installment_total_months}{" "}
                  bulan
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {formatRupiah(
                    account.nextInstallment?.remaining ?? account.remaining,
                  )}
                </p>
                <MarkPaidButton
                  accountId={account.id}
                  amountLabel={formatRupiah(
                    account.nextInstallment?.remaining ?? account.remaining,
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-[#e8e1d4] bg-[#fffdf9]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-ink">
              Jatuh tempo berikutnya
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Tagihan terdekat beserta nominal per bulan.
            </p>
          </div>
          <Link
            href="/debt/accounts"
            className="text-xs font-medium text-olive-700 hover:underline"
          >
            Lihat utang
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={
                unpaidAccounts.length === 0
                  ? "Belum ada tagihan"
                  : "Semua tagihan sudah dibayar"
              }
              body={
                unpaidAccounts.length === 0
                  ? "Tambahkan utang beserta nominal, tenor, dan bulan jatuh tempo."
                  : "Tagihan yang sudah dibayar bulan ini tidak ditampilkan lagi."
              }
              icon={<CalendarClock className="size-8" aria-hidden />}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border border-olive-100 bg-[#f8f4ec] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">
                    {account.creditor_name}
                  </p>
                  <Badge
                    tone={account.overdueInstallments > 0 ? "blush" : "neutral"}
                  >
                    {account.overdueInstallments > 0 ? "Terlambat" : "Berikutnya"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {account.reference_label ? `${account.reference_label} · ` : ""}
                  {formatDebtDate(account.due_date)}
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {formatRupiah(
                    account.nextInstallment?.remaining ?? account.remaining,
                  )}
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  tagihan bulan ini · {account.installment_month}/
                  {account.installment_total_months} bulan · sisa total{" "}
                  {formatRupiah(account.remaining)}
                </p>

                <MarkPaidButton
                  accountId={account.id}
                  amountLabel={formatRupiah(
                    account.nextInstallment?.remaining ?? account.remaining,
                  )}
                />
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
                      {account.due_date
                        ? `Jatuh tempo ${formatDebtDate(account.due_date)}`
                        : "Tanpa tanggal jatuh tempo"}
                      {` · ${account.installment_month}/${account.installment_total_months} bulan`}
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
          <div>
            <h2 className="font-heading text-xl text-ink">Tagihan lewat</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Tagihan yang sudah melewati tanggal jatuh tempo.
            </p>
          </div>

          {late.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Tidak ada tagihan lewat"
                body="Semua tagihan yang lewat tanggal sudah dibayar."
                icon={<CalendarClock className="size-8" aria-hidden />}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {late.slice(0, 5).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f4ec] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {account.creditor_name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {formatDebtDate(account.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">
                      {formatRupiah(
                        account.nextInstallment?.remaining ?? account.remaining,
                      )}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      sisa total {formatRupiah(account.remaining)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
