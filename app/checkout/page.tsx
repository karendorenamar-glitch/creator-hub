import Link from "next/link";
import { redirect } from "next/navigation";
import { submitPaymentAction } from "@/app/checkout/actions";
import { Badge, Card } from "@/components/wedding/ui";
import { PaymentVerificationNotice } from "@/components/wedding/payment-verification-notice";
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

  return (
    <div className="wedding-app wedding-surface min-h-screen px-4 py-10 text-cocoa sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
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
          <Card className="space-y-3 border-emerald-100 bg-emerald-50/60">
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
          <Card className="space-y-3 text-sm">
            <Badge tone={justSubmitted ? "success" : "warning"}>
              {justSubmitted ? "Bukti pembayaran terkirim" : "Menunggu verifikasi"}
            </Badge>
            <PaymentVerificationNotice />
            <p className="text-cocoa/55">
              Referensi <strong>{payment.reference}</strong> ·{" "}
              {payment.sender_name} · {formatIDR(payment.amount_idr)} ·{" "}
              {formatDateTime(payment.submitted_at, locale)}
            </p>
            <Link
              href="/checkout/status"
              className="inline-flex text-sm font-medium text-rosewood underline underline-offset-4"
            >
              Lihat status pembayaran
            </Link>
          </Card>
        ) : (
          <>
            {payment?.status === "rejected" ? (
              <Card className="space-y-1 border-rose-100 bg-rose-50/60 text-sm">
                <Badge tone="warning">Pembayaran ditolak</Badge>
                <p className="text-cocoa/75">
                  {payment.rejection_reason ?? "Bukti belum dapat diverifikasi."}
                </p>
                <p className="text-xs text-cocoa/55">
                  Silakan ajukan bukti transfer baru.
                </p>
              </Card>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {ERRORS[error] ?? "Terjadi kesalahan."}
              </p>
            ) : null}

            <Card className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl">
                    {PAYMENT_CONFIG.productName}
                  </h2>
                  <p className="text-sm text-cocoa/60">
                    {PAYMENT_CONFIG.productDescription}
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

          </>
        )}
      </div>
    </div>
  );
}
