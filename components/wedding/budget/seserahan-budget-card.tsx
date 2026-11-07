import Link from "next/link";
import { Money } from "@/components/wedding/money";
import { Card, Progress } from "@/components/wedding/ui";
import {
  summarizeSeserahan,
  type SeserahanSummaryRow,
  type SeserahanTotals,
} from "@/lib/wedding/seserahan-summary";

export function SeserahanBudgetCard({
  rows,
}: {
  rows: SeserahanSummaryRow[];
}) {
  const summary = summarizeSeserahan(rows);

  const amount = (value: number) => <Money value={value} />;

  const partyBlock = (title: string, totals: SeserahanTotals) => (
    <div className="rounded-xl border border-petal-100 bg-white px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{title}</p>
        <span className="rounded-full bg-petal-50 px-2 py-0.5 text-[10px] font-medium text-rosewood">
          {totals.purchasedItems}/{totals.items} dibeli
        </span>
      </div>
      <div className="mt-2 space-y-1 text-xs text-ink-soft">
        <p className="flex justify-between gap-2">
          <span>Rencana</span>
          <span className="text-ink">{amount(totals.plan)}</span>
        </p>
        <p className="flex justify-between gap-2">
          <span>Sudah dibeli</span>
          <span className="text-olive-700">{amount(totals.actual)}</span>
        </p>
        <p className="flex justify-between gap-2">
          <span>Belum dibeli</span>
          <span className="text-ink">{amount(totals.remaining)}</span>
        </p>
      </div>
      <div className="mt-2">
        <Progress value={totals.progress} tone="olive" />
      </div>
    </div>
  );

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-ink">Seserahan</h2>
          <p className="text-sm text-ink-soft">
            Dihitung otomatis dari modul Seserahan. Tidak termasuk Total Pengeluaran di
            atas agar tidak terhitung dua kali.
          </p>
        </div>
        <Link
          href="/wedding/seserahan"
          className="rounded-full border border-petal-200 px-3 py-1.5 text-xs font-medium text-rosewood transition-colors hover:bg-petal-50"
        >
          Lihat Detail
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-petal-100 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">Total Rencana</p>
          <p className="mt-1 font-heading text-base text-ink">{amount(summary.all.plan)}</p>
        </div>
        <div className="rounded-xl border border-olive-100 bg-olive-50/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">Sudah Dibeli</p>
          <p className="mt-1 font-heading text-base text-olive-700">{amount(summary.all.actual)}</p>
        </div>
        <div className="rounded-xl border border-champagne/50 bg-cream/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">Belum Dibeli</p>
          <p className="mt-1 font-heading text-base text-ink">{amount(summary.all.remaining)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-ink-soft">
          <span>Progress pembelian</span>
          <span className="font-heading text-sm text-ink">{summary.all.progress}%</span>
        </div>
        <div className="mt-1">
          <Progress value={summary.all.progress} tone="olive" />
        </div>
      </div>

      <details className="rounded-xl border border-petal-100 bg-cream/40 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-rosewood">
          Rincian per pihak
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {partyBlock("Pihak Pria", summary.groom)}
          {partyBlock("Pihak Wanita", summary.bride)}
        </div>
      </details>
    </Card>
  );
}
