import Link from "next/link";
import { redirect } from "next/navigation";
import {
  submitPaymentAction,
  submitPaypalPaymentAction,
} from "@/app/checkout/actions";
import { Badge, Card } from "@/components/wedding/ui";
import { PaymentVerificationNotice } from "@/components/wedding/payment-verification-notice";
import { PaypalHostedButton } from "@/components/wedding/paypal-button";
import { SubmitButton } from "@/components/wedding/submit-button";
import { PAYMENT_CONFIG } from "@/lib/wedding/payment-config";
import { formatDateTime, formatIDR } from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadAccountContext } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Pembayaran" };

const ERRORS: Record<string, string> = {
  sender: "Nama pemilik rekening pengirim wajib diisi.",
  receipt: "Bukti transfer wajib diunggah.",
  size: "Ukuran file melebihi 5 MB.",
  type: "Format harus JPG, PNG, WEBP, atau PDF.",
  upload: "Upload gagal. Coba lagi.",
  save: "Pembayaran gagal disimpan. Coba lagi.",
  duplicate: "Sudah ada pembayaran yang sedang diproses.",
  payerEmail: "Invalid PayPal email address.",
  paypalTxn: "Invalid PayPal transaction ID (at least 6 characters).",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const account = await loadAccountContext();
  if (!account) redirect("/wedding/login?next=/checkout");

  const locale = await getLocale();
  const { error, sent } = await searchParams;
  const supabase = await createWeddingClient();

  const { data: rows } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", account.userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const payment = rows?.[0] ?? null;
  const active = account.hasEntitlement;
  const pendingReview = payment?.status === "pending_review";
  const justSubmitted = sent === "1";
  const isPaypalPayment = payment?.method === "paypal";


  return (
    <div className="wedding-app wedding-surface min-h-screen px-4 py-10 text-cocoa sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">
            Pembayaran
          </p>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl">
            {active
              ? "Akses kamu sudah aktif"
              : pendingReview
                ? "Pembayaran sedang diproses"
                : "Mulai Perencanaan Pernikahanmu"}
          </h1>
        </div>

        {active ? (
          <Card className="max-w-2xl space-y-3 border-emerald-100 bg-emerald-50/60">
            <Badge tone="success">Lifetime access aktif</Badge>
            <p className="text-sm text-cocoa/70">
              Pembayaran sudah diverifikasi. Seluruh fitur wedding planner
              terbuka untuk akun ini.
            </p>
            <Link
              href={account.hasWedding ? "/wedding/dashboard" : "/wedding/onboarding"}
              className="inline-flex rounded-full bg-rosewood px-5 py-2.5 text-sm font-medium text-ivory hover:bg-cocoa"
            >
              {account.hasWedding
                ? "Masuk ke dashboard"
                : "Lanjut isi data pernikahan"}
            </Link>
          </Card>
        ) : pendingReview ? (
          <Card className="max-w-2xl space-y-3 text-sm">
            <Badge tone={justSubmitted ? "success" : "warning"}>
              {isPaypalPayment
                ? justSubmitted
                  ? "Payment submitted"
                  : "Awaiting verification"
                : justSubmitted
                  ? "Bukti pembayaran terkirim"
                  : "Menunggu verifikasi"}
            </Badge>
            {isPaypalPayment ? (
              <div className="space-y-2 text-sm text-cocoa/70">
                <p className="font-medium text-cocoa">
                  Please wait, your payment is being verified.
                </p>
                <p>
                  We received your PayPal transaction ID. Our team verifies it
                  before activating lifetime access.
                </p>
                <p>
                  Business hours: {PAYMENT_CONFIG.verification.hours} (GMT+7).
                  Requests outside these hours are reviewed on the next
                  business day.
                </p>
              </div>
            ) : (
              <PaymentVerificationNotice />
            )}
            <p className="text-cocoa/55">
              Reference <strong>{payment.reference}</strong> ·{" "}
              {payment.sender_name} ·{" "}
              {isPaypalPayment
                ? `USD ${Number(payment.amount_usd ?? 0).toFixed(2)}`
                : formatIDR(payment.amount_idr)}{" "}
              · {formatDateTime(payment.submitted_at, locale)}
            </p>
            <Link
              href="/checkout/status"
              className="inline-flex text-sm font-medium text-rosewood underline underline-offset-4"
            >
              {isPaypalPayment ? "View payment status" : "Lihat status pembayaran"}
            </Link>
          </Card>
        ) : (
          <>
            {payment?.status === "rejected" ? (
              <Card className="max-w-2xl space-y-1 border-rose-100 bg-rose-50/60 text-sm">
                <Badge tone="warning">
                  {isPaypalPayment ? "Payment rejected" : "Pembayaran ditolak"}
                </Badge>
                <p className="text-cocoa/75">
                  {payment.rejection_reason ??
                    (isPaypalPayment
                      ? "We could not verify this PayPal transaction."
                      : "Bukti belum dapat diverifikasi.")}
                </p>
                <p className="text-xs text-cocoa/55">
                  {isPaypalPayment
                    ? "Please submit a valid PayPal transaction ID."
                    : "Silakan ajukan bukti transfer baru."}
                </p>
              </Card>
            ) : null}

            {error ? (
              <p className="max-w-2xl rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {ERRORS[error] ?? "Terjadi kesalahan."}
              </p>
            ) : null}

            <div className="grid items-start gap-5 lg:grid-cols-2">
            <Card className="space-y-4 border-blush/70">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  🇮🇩
                </span>
                <h2 className="font-heading text-xl">Pelanggan Indonesia</h2>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {PAYMENT_CONFIG.productName}
                  </p>
                  <p className="text-xs text-cocoa/60">
                    Sekali bayar · akses seumur hidup · tanpa langganan
                  </p>
                </div>
                <p className="shrink-0 font-heading text-2xl">
                  {formatIDR(PAYMENT_CONFIG.amountIdr)}
                </p>
              </div>

              <div className="rounded-2xl bg-blush/35 p-4 text-sm">
                <p className="font-medium">
                  Transfer tepat {formatIDR(PAYMENT_CONFIG.amountIdr)} ke:
                </p>
                <p className="mt-2 leading-relaxed text-cocoa/75">
                  Bank {PAYMENT_CONFIG.bank.name}
                  <br />
                  No. rekening{" "}
                  <strong className="tracking-wide">
                    {PAYMENT_CONFIG.bank.accountNumber}
                  </strong>
                  <br />
                  a.n. {PAYMENT_CONFIG.bank.accountHolder}
                </p>
              </div>

              <form action={submitPaymentAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="senderName" className="text-sm font-medium">
                    Nama pemilik rekening pengirim
                  </label>
                  <input
                    id="senderName"
                    name="senderName"
                    required
                    maxLength={120}
                    placeholder="Sesuai nama di rekening pengirim"
                    className="w-full rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="receipt" className="text-sm font-medium">
                    Bukti transfer
                  </label>
                  <input
                    id="receipt"
                    name="receipt"
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="w-full rounded-xl border border-blush bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blush/60 file:px-3 file:py-1.5 file:text-xs"
                  />
                  <p className="text-xs text-cocoa/50">
                    JPG, PNG, WEBP, atau PDF — maksimal 5 MB.
                  </p>
                </div>

                <SubmitButton
                  label="Kirim Bukti Pembayaran"
                  pendingLabel="Mengirim bukti…"
                />

                <p className="text-xs leading-relaxed text-cocoa/50">
                  Akses aktif setelah admin memverifikasi dana masuk ke rekening
                  BCA. Bukti transfer saja tidak membuka akses. Verifikasi
                  dilakukan pada jam kerja {PAYMENT_CONFIG.verification.hours}.
                </p>
              </form>
            </Card>

            <Card className="space-y-4 border-champagne/70">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  🌎
                </span>
                <h2 className="font-heading text-xl">
                  International Customers
                </h2>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Wedding Planner – Lifetime Access
                  </p>
                  <p className="text-xs text-cocoa/60">
                    One-time payment · lifetime access · no subscription
                  </p>
                </div>
                <p className="shrink-0 font-heading text-2xl">
                  USD {PAYMENT_CONFIG.paypal.amountUsd.toFixed(2)}
                </p>
              </div>

              <p className="rounded-2xl bg-champagne/20 p-4 text-sm leading-relaxed text-cocoa/80">
                For customers outside Indonesia. Pay securely using PayPal.
              </p>

              <PaypalHostedButton />

              <div className="space-y-1.5 rounded-2xl border border-blush/60 bg-white/70 p-4">
                <p className="text-sm font-medium">
                  Already paid with PayPal?
                </p>
                <p className="text-xs leading-relaxed text-cocoa/65">
                  Copy the <strong>Transaction ID</strong> from your PayPal
                  receipt or email, then submit it below so we can verify your
                  payment. Access is not activated automatically.
                </p>
              </div>

              <form action={submitPaypalPaymentAction} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="payerEmail" className="text-sm font-medium">
                    PayPal email
                  </label>
                  <input
                    id="payerEmail"
                    name="payerEmail"
                    type="email"
                    required
                    maxLength={200}
                    defaultValue={account.email ?? ""}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="paypalTransactionId" className="text-sm font-medium">
                    PayPal transaction ID
                  </label>
                  <input
                    id="paypalTransactionId"
                    name="paypalTransactionId"
                    required
                    minLength={6}
                    maxLength={64}
                    placeholder="Example: 8AB12345CD678901E"
                    className="w-full rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="payerName" className="text-sm font-medium">
                    PayPal account name (optional)
                  </label>
                  <input
                    id="payerName"
                    name="payerName"
                    maxLength={120}
                    placeholder="PayPal account holder name"
                    className="w-full rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
                  />
                </div>

                <SubmitButton
                  label="Submit PayPal transaction ID"
                  pendingLabel="Submitting…"
                />

                <p className="text-xs leading-relaxed text-cocoa/50">
                  We verify the transaction in our PayPal Business account.
                  Lifetime access is activated only after approval, usually
                  within business hours {PAYMENT_CONFIG.verification.hours}
                  (GMT+7).
                </p>
              </form>
            </Card>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
