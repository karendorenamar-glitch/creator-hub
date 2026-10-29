import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card } from "@/components/wedding/ui";
import { PaymentVerificationNotice } from "@/components/wedding/payment-verification-notice";
import { formatDateTime, formatIDR } from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadAccountContext } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Status Pembayaran" };

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Menunggu pembayaran",
  pending_review: "Menunggu verifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default async function CheckoutStatusPage() {
  const account = await loadAccountContext();
  if (!account) redirect("/wedding/login?next=/checkout/status");

  const locale = await getLocale();
  const supabase = await createWeddingClient();

  const { data: rows } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", account.userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const payment = rows?.[0] ?? null;
  const active = account.hasEntitlement;

  return (
    <div className="wedding-app wedding-surface min-h-screen px-4 py-10 text-cocoa sm:px-6">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">
            Status pembayaran
          </p>
          <h1 className="mt-3 font-heading text-3xl">Pembayaranmu</h1>
        </div>

        {!payment ? (
          <Card className="space-y-3">
            <Badge tone="muted">Belum ada pembayaran</Badge>
            <p className="text-sm text-cocoa/70">
              Kamu belum mengirim bukti transfer.
            </p>
            <Link
              href="/checkout"
              className="inline-flex rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa"
            >
              Ke halaman pembayaran
            </Link>
          </Card>
        ) : (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-heading text-lg">{payment.reference}</p>
              <Badge
                tone={
                  active || payment.status === "approved"
                    ? "success"
                    : payment.status === "rejected"
                      ? "warning"
                      : "neutral"
                }
              >
                {STATUS_LABELS[payment.status] ?? payment.status}
              </Badge>
            </div>

            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-cocoa/55">Pengirim</dt>
                <dd>{payment.sender_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/55">Nominal</dt>
                <dd>{formatIDR(payment.amount_idr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cocoa/55">Dikirim</dt>
                <dd>{formatDateTime(payment.submitted_at, locale)}</dd>
              </div>
            </dl>

            {payment.status === "pending_review" ? (
              <PaymentVerificationNotice />
            ) : null}

            {payment.status === "approved" ? (
              <>
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Pembayaran berhasil diverifikasi. Wedding planner kamu sudah
                  aktif!
                </p>
                <Link
                  href="/wedding/dashboard"
                  className="inline-flex rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa"
                >
                  Masuk ke dashboard
                </Link>
              </>
            ) : null}

            {payment.status === "rejected" ? (
              <>
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {payment.rejection_reason ?? "Bukti pembayaran belum dapat diverifikasi."}
                </p>
                <Link
                  href="/checkout"
                  className="inline-flex rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa"
                >
                  Ajukan bukti baru
                </Link>
              </>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
