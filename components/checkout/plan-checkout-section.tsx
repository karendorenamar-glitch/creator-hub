"use client";

import { useRef, useState } from "react";
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
  getPaymentQrUrl,
  isPlanAtLeast,
  PAYMENT_BANK_DETAILS,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import {
  isAllowedPaymentProofFile,
  MAX_PAYMENT_PROOF_FILE_SIZE_BYTES,
} from "@/lib/payment-proof";
import { uploadPaymentProofFile } from "@/lib/payment-proof-storage";
import type { OrgPlan, PaymentSubmission } from "@/types/database";

type PlanCheckoutSectionProps = {
  plan: CheckoutPlan;
  currentPlan: OrgPlan;
  orgId: string;
  orgName: string;
  latestSubmission: PaymentSubmission | null;
};

export function PlanCheckoutSection({
  plan,
  currentPlan,
  orgId,
  orgName,
  latestSubmission,
}: PlanCheckoutSectionProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = CHECKOUT_PLAN_CONFIG[plan];
  const qrUrl = getPaymentQrUrl();

  const [paymentDate, setPaymentDate] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingForPlan =
    latestSubmission?.plan === plan && latestSubmission.status === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentDate.trim()) {
      showError("Select the payment date.");
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
        senderName,
        notes,
        proofUrl: uploadResult.proofUrl,
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

  if (isPlanAtLeast(currentPlan, plan)) {
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

        <a
          href={latestSubmission.proof_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-kefoo-600 hover:text-kefoo-500"
        >
          View submitted proof
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Plan summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {config.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Workspace: <span className="font-medium text-slate-900">{orgName}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
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
            Scan to pay
          </p>

          {qrUrl ? (
            <div className="mt-4 flex justify-center">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`${config.name} payment QR code`}
                  className="h-60 w-60 object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                QR code coming soon
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Use the bank transfer details on the left for now.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Submit payment proof
          </p>
          <p className="mt-2 text-sm text-slate-600">
            After transferring, fill in the details below and upload your receipt
            or screenshot.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <FormField label="Payment date" htmlFor="payment-date">
              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={isSubmitting}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Sender name (optional)" htmlFor="sender-name">
              <input
                id="sender-name"
                type="text"
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                disabled={isSubmitting}
                placeholder="Name on bank account"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Notes (optional)" htmlFor="payment-notes">
              <textarea
                id="payment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                placeholder="Reference number or extra details"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-kefoo-400 focus:ring-2 focus:ring-kefoo-400/20 disabled:opacity-60"
              />
            </FormField>

            <FormField label="Payment proof" htmlFor="payment-proof">
              <input
                ref={fileInputRef}
                id="payment-proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="sr-only"
                disabled={isSubmitting}
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
