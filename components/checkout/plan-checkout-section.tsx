"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Upload } from "lucide-react";
import { submitPlanPayment } from "@/app/actions/payment-submissions";
import { FormField } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  CHECKOUT_PLAN_CONFIG,
  formatCheckoutPlanLabel,
  formatOrgPlanLabel,
  formatPaymentSubmissionStatus,
  getPaymentInstructions,
  isPlanAtLeast,
  PAYMENT_BANK_DETAILS,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import {
  isAllowedPaymentProofFile,
  isPaymentProofImageFile,
  isPaymentProofImageUrl,
  isPaymentProofPdfUrl,
  MAX_PAYMENT_PROOF_FILE_SIZE_BYTES,
} from "@/lib/payment-proof";
import { uploadPaymentProofFile } from "@/lib/payment-proof-storage";
import { getTodayDateInJakarta } from "@/lib/payment-dates";
import type { OrgPlan, PaymentSubmission } from "@/types/database";

function SubmittedProofPreview({
  proofUrl,
  title = "Your submitted proof",
}: {
  proofUrl: string;
  title?: string;
}) {
  const isImage = isPaymentProofImageUrl(proofUrl);
  const isPdf = isPaymentProofPdfUrl(proofUrl);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-kefoo-600 hover:text-kefoo-500"
        >
          Open full size
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {isImage ? (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Submitted payment proof"
            className="max-h-96 w-full object-contain"
          />
        </a>
      ) : isPdf ? (
        <iframe
          src={proofUrl}
          title="Submitted payment proof"
          className="mt-4 h-96 w-full rounded-xl border border-slate-200 bg-slate-50"
        />
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Your proof file is saved. Use &quot;Open full size&quot; to view it.
        </p>
      )}
    </div>
  );
}

type PlanCheckoutSectionProps = {
  plan: CheckoutPlan;
  currentPlan: OrgPlan;
  orgId: string;
  accountName: string;
  latestSubmission: PaymentSubmission | null;
  renewEarly?: boolean;
};

export function PlanCheckoutSection({
  plan,
  currentPlan,
  orgId,
  accountName,
  latestSubmission,
  renewEarly = false,
}: PlanCheckoutSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = CHECKOUT_PLAN_CONFIG[plan];

  const [paymentDate, setPaymentDate] = useState(() => getTodayDateInJakarta());
  const [senderName, setSenderName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!proofFile || !isPaymentProofImageFile(proofFile)) {
      setProofPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [proofFile]);

  const pendingForPlan =
    latestSubmission?.plan === plan && latestSubmission.status === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!proofFile) {
      showError("Upload your payment proof before submitting.");
      return;
    }

    if (!isAllowedPaymentProofFile(proofFile)) {
      showError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }

    if (proofFile.size > MAX_PAYMENT_PROOF_FILE_SIZE_BYTES) {
      showError("File must be 10 MB or smaller.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadResult = await uploadPaymentProofFile(orgId, proofFile);

      if ("error" in uploadResult) {
        showError(uploadResult.error);
        return;
      }

      const result = await submitPlanPayment({
        plan,
        paymentDate,
        senderName: senderName.trim(),
        proofUrl: uploadResult.proofUrl,
        renewEarly,
      });

      if ("error" in result && result.error) {
        showError(result.error);
        return;
      }

      showSuccess(
        "Payment proof submitted. Please wait — your account will be active after we verify your payment.",
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPlanAtLeast(currentPlan, plan) && !renewEarly) {
    const message = `Your workspace is already on the ${formatOrgPlanLabel(currentPlan)} plan.`;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
        <p className="font-medium">{message}</p>
        <Link
          href="/settings"
          className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-600"
        >
          View plan in Settings
        </Link>
      </div>
    );
  }

  if (pendingForPlan && latestSubmission) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-kefoo-200 bg-kefoo-50 px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Please wait — your account will be active
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We received your {formatCheckoutPlanLabel(plan)} payment proof and
            are verifying your transfer. This usually takes up to 1 business day.
            You&apos;ll get full access once payment is approved.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Payment status</p>
          <p className="mt-2 text-amber-900">
            {formatPaymentSubmissionStatus(latestSubmission.status)} ·{" "}
            {formatCheckoutPlanLabel(plan)} · submitted{" "}
            {new Date(latestSubmission.created_at).toLocaleDateString("id-ID")}
          </p>
          {latestSubmission.sender_name ? (
            <p className="mt-2 text-amber-900">
              Name of Bank Account: {latestSubmission.sender_name}
            </p>
          ) : null}
          <p className="mt-2 text-amber-900">
            Need help? Email{" "}
            <a
              href="mailto:hello@kefoo.tech"
              className="font-medium underline underline-offset-2"
            >
              hello@kefoo.tech
            </a>
            .
          </p>
        </div>

        <SubmittedProofPreview proofUrl={latestSubmission.proof_url} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <p className="text-base font-medium text-slate-900">
          Hi {accountName}, please proceed your payment.
        </p>

        <section className="relative overflow-hidden rounded-2xl border border-kefoo-400/20 bg-white p-6 shadow-[0_0_48px_-16px_rgba(74,74,74,0.35)]">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-kefoo-500/[0.07] to-transparent" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Plan summary
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {config.name}
            </h2>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
              {config.originalPriceLabel ? (
                <span className="w-full text-sm text-slate-500 line-through decoration-slate-400">
                  {config.originalPriceLabel}
                </span>
              ) : null}
              <span className="text-3xl font-semibold tracking-tight text-slate-900">
                {config.priceLabel}
              </span>
              <span className="text-sm text-slate-500">{config.periodLabel}</span>
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
              {config.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-kefoo-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transfer instructions
          </p>
          <ol className="mt-4 space-y-2 text-sm text-slate-600">
            {getPaymentInstructions(plan).map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kefoo-50 text-xs font-semibold text-kefoo-600">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <dl className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm">
            <div>
              <dt className="text-slate-500">Bank</dt>
              <dd className="font-medium text-slate-900">
                {PAYMENT_BANK_DETAILS.bankName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Account name</dt>
              <dd className="font-medium text-slate-900">
                {PAYMENT_BANK_DETAILS.accountName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Account number</dt>
              <dd className="font-mono text-base font-semibold tracking-wide text-slate-900">
                {PAYMENT_BANK_DETAILS.accountNumber}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-medium text-slate-900">
                {config.priceLabel}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Submit payment proof
          </p>
          <p className="mt-2 text-sm text-slate-600">
            After transferring, fill in the payment date (WIB), your bank account
            name, and upload your receipt or screenshot.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <FormField label="Payment date (WIB)" htmlFor="payment-date" required>
              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                max={getTodayDateInJakarta()}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={isSubmitting}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use the transfer date shown on your receipt (Indonesia time).
              </p>
            </FormField>

            <FormField label="Name of Bank Account" htmlFor="sender-name" required>
              <input
                id="sender-name"
                type="text"
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                disabled={isSubmitting}
                placeholder="As shown on the transfer receipt"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Payment proof" htmlFor="payment-proof" required>
              <input
                ref={fileInputRef}
                id="payment-proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="sr-only"
                disabled={isSubmitting}
                required
                onChange={(event) => {
                  setProofFile(event.target.files?.[0] ?? null);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-700 transition-colors hover:border-kefoo-300 hover:bg-kefoo-50 hover:text-kefoo-700 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {proofFile ? proofFile.name : "Upload PDF, JPG, or PNG"}
              </button>
              {proofPreviewUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofPreviewUrl}
                    alt="Payment proof preview"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : proofFile ? (
                <p className="mt-2 text-xs text-slate-500">
                  PDF selected: {proofFile.name}
                </p>
              ) : null}
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-kefoo-400 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit ${config.name} payment`
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
