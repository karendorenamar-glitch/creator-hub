import { Clock } from "lucide-react";
import { PAYMENT_CONFIG } from "@/lib/wedding/payment-config";

/**
 * Customer-facing copy while a manual transfer is waiting for admin review.
 * Kept in one component so checkout, status, and post-submit states stay aligned.
 */
export function PaymentVerificationNotice() {
  const verification = PAYMENT_CONFIG.verification;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950"
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="font-semibold">{verification.title}</p>
          <p className="leading-relaxed text-amber-900/80">
            {verification.message}
          </p>
          <p className="font-medium">
            {verification.hoursLabel}:{" "}
            <span className="tracking-wide">{verification.hours}</span>
          </p>
          <p className="text-xs leading-relaxed text-amber-900/70">
            {verification.outsideHoursNote}
          </p>
        </div>
      </div>
    </div>
  );
}
