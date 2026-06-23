import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";

export function DashboardScaleSection() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-kefoo-600">
            Scale workspace
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Payouts and executive reporting
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Your Scale plan includes payout tracking, custom reporting views, and
            priority support for agency operations.
          </p>
        </div>
        <Link
          href="/payouts"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-kefoo-200 hover:bg-kefoo-50 hover:text-kefoo-700"
        >
          <Wallet className="h-4 w-4" />
          Open Payouts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
