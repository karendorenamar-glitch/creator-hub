import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, Info } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { formatDateTime, formatIDR } from "@/lib/wedding/format";
import { isSubscriptionActive, loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Subscription" };

export default async function BillingPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = weddingCopy[locale];
  const supabase = await createWeddingClient();

  const { data: payments } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("wedding_id", session.wedding.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const subscription = session.subscription;
  const isActive = isSubscriptionActive(subscription);
  const statusLabel = !subscription
    ? copy.billing.statusInactive
    : {
        active: copy.billing.statusActive,
        inactive: copy.billing.statusInactive,
        expired: copy.billing.statusExpired,
        canceled: copy.billing.statusCanceled,
      }[subscription.status];

  return (
    <div className="space-y-7">
      <PageHeader title={copy.billing.title} subtitle={copy.billing.subtitle} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="bg-gradient-to-br from-white via-ivory to-blush-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-champagne-500">
                {copy.billing.planName}
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-ink">
                {copy.billing.price}
                <span className="ml-1 text-sm font-normal text-ink-soft">
                  {copy.common.perMonth}
                </span>
              </p>
            </div>
            <span className="rounded-full bg-blush-100 p-3 text-blush-600">
              <CreditCard className="size-5" aria-hidden />
            </span>
          </div>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
            {copy.billing.planDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge tone={isActive ? "success" : "warning"}>{statusLabel}</Badge>
            {subscription?.current_period_end ? (
              <span className="text-xs text-ink-soft">
                {copy.billing.expiresAt}:{" "}
                {formatDateTime(subscription.current_period_end, locale)}
              </span>
            ) : null}
            {subscription?.started_at ? (
              <span className="text-xs text-ink-soft">
                {copy.billing.startedAt}:{" "}
                {formatDateTime(subscription.started_at, locale)}
              </span>
            ) : null}
          </div>

          <ul className="mt-6 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            {[
              copy.nav.budget,
              copy.nav.guests,
              copy.nav.vendors,
              copy.nav.checklist,
              copy.nav.inspiration,
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-champagne-200 bg-champagne-100/40">
          <div className="flex items-center gap-2 text-champagne-500">
            <Info className="size-4" aria-hidden />
            <h2 className="text-sm font-semibold">{copy.billing.noticeTitle}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {copy.billing.noticeBody}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {copy.billing.contactToActivate}
          </p>
          <p className="mt-4 text-xs text-ink-soft/80">
            {copy.billing.amount}: {formatIDR(20000)} {copy.common.perMonth}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-heading text-base font-semibold text-ink">
          {copy.billing.paymentHistory}
        </h2>
        {!payments || payments.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
            {copy.billing.noPayments}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-blush-100 text-xs uppercase tracking-[0.1em] text-ink-soft">
                  <th className="py-2 pr-4 font-medium">{copy.billing.date}</th>
                  <th className="py-2 pr-4 font-medium">{copy.billing.amount}</th>
                  <th className="py-2 pr-4 font-medium">{copy.billing.status}</th>
                  <th className="py-2 font-medium">{copy.billing.method}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-2.5 pr-4 text-ink">
                      {formatDateTime(payment.created_at, locale)}
                    </td>
                    <td className="py-2.5 pr-4 text-ink">
                      {formatIDR(payment.amount_idr)}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">{payment.status}</td>
                    <td className="py-2.5 text-ink-soft">
                      {payment.provider ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
