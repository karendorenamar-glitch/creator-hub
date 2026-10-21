import Link from "next/link";
import { Card, StatCard } from "@/components/wedding/ui";
import { formatIDR } from "@/lib/wedding/format";
import { getAdminOverview, requireAdmin } from "@/lib/wedding/admin";

export const metadata = { title: "Admin — Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const kpi = await getAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Overview
        </p>
        <h1 className="mt-2 font-heading text-3xl">Ringkasan Kefoo</h1>
        <p className="text-sm text-cocoa/60">
          Angka diambil langsung dari database. Pendapatan hanya menghitung
          pembayaran berstatus <strong>approved</strong>.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total pengguna" value={String(kpi.users)} hint={kpi.usersApprox ? "≥ 1000 (batas baca)" : undefined} />
        <StatCard label="Total wedding" value={String(kpi.weddings)} tone="champagne" />
        <StatCard label="Menunggu review" value={String(kpi.pending)} hint="Perlu diperiksa" />
        <StatCard label="Pendapatan" value={formatIDR(kpi.revenueIdr)} hint="Pembayaran approved" tone="champagne" />
        <StatCard label="Pembayaran approved" value={String(kpi.approved)} />
        <StatCard label="Pembayaran rejected" value={String(kpi.rejected)} />
        <StatCard label="Pengguna 7 hari" value={String(kpi.users7d)} />
        <StatCard label="Pengguna 30 hari" value={String(kpi.users30d)} />
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="font-heading text-lg">Pembayaran</h2>
          <p className="text-sm text-cocoa/60">
            {kpi.pending} pengajuan menunggu verifikasi transfer BCA.
          </p>
          <Link
            href="/admin/payments?status=pending_review"
            className="inline-flex rounded-full bg-rosewood px-4 py-2 text-sm text-ivory hover:bg-cocoa"
          >
            Review pembayaran
          </Link>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-heading text-lg">Bantuan pengguna</h2>
          <p className="text-sm text-cocoa/60">
            Cari akun, wedding, dan status pembayaran untuk menjawab pertanyaan
            pelanggan.
          </p>
          <Link
            href="/admin/support"
            className="inline-flex rounded-full border border-blush px-4 py-2 text-sm text-rosewood hover:bg-blush/40"
          >
            Buka customer support
          </Link>
        </Card>
      </div>

      <p className="text-xs text-cocoa/45">
        Catatan: jumlah pengguna dibaca lewat service role di server setelah
        verifikasi admin, dibatasi 1000 akun per pembacaan.
      </p>
    </div>
  );
}
