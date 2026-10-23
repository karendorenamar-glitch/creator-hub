import { redirect } from "next/navigation";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { VendorGroups } from "@/components/wedding/vendors/vendor-groups";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatIDR } from "@/lib/wedding/format";
import { label } from "@/lib/wedding/labels";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { calculateBudget } from "@/lib/wedding/budget-calc";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Anggaran Menikah" };

export default async function BudgetPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const supabase = await createWeddingClient();

  const [groupsResult, vendorsResult, paymentsResult] = await Promise.all([
    supabase
      .from("vendor_groups")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("vendors").select("*").is("archived_at", null),
    supabase
      .from("vendor_payments")
      .select("*")
      .order("paid_on", { ascending: false }),
  ]);

  const groups = groupsResult.data ?? [];
  const vendors = vendorsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const calc = calculateBudget({
    groups: groups.map((group) => ({
      id: group.id,
      selected_vendor_id: group.selected_vendor_id,
      status: group.status,
    })),
    vendors: vendors.map((vendor) => ({
      id: vendor.id,
      agreed_price: vendor.agreed_price,
      quoted_price: vendor.quoted_price,
    })),
    payments: payments.map((payment) => ({
      vendor_id: payment.vendor_id,
      amount: Number(payment.amount),
    })),
    target: Number(session.wedding.total_budget ?? 0),
  });

  const target = Number(session.wedding.total_budget ?? 0);

  const {
    committedCost,
    committedPaid,
    outstandingBill,
    remaining,
    paidPercent,
    overpaid,
    overBudget,
    unknownPriceGroups,
    statusTotals,
    statusVendors,
  } = calc;

  const partnerOne = session.wedding.partner_one_name;
  const partnerTwo = session.wedding.partner_two_name?.trim() ?? "";
  const picOptions = [
    partnerOne,
    partnerTwo,
    `Ortu ${partnerOne}`,
    partnerTwo ? `Ortu ${partnerTwo}` : "",
  ].filter(Boolean);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.budget.title} subtitle={copy.budget.subtitle} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={copy.budget.totalBudget} value={formatIDR(target)} />
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.budget.vendorCommitments}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {formatIDR(committedCost)}
            </p>
            {unknownPriceGroups > 0 ? (
              <p className="mt-0.5 text-xs text-ink-soft">
                {unknownPriceGroups} {copy.vendors.priceUnknown}
              </p>
            ) : null}
          </div>

          <dl className="space-y-1 border-t border-olive-100 pt-3 text-xs">
            {(["diskusi", "dp", "lunas"] as const).map((status) => (
              <div key={status} className="flex items-baseline justify-between gap-2">
                <dt className="text-ink-soft">
                  {label("paymentStatus", status, locale)}
                  {" "}
                  <span className="text-ink-soft/60">
                    ({statusVendors[status] ?? 0})
                  </span>
                </dt>
                <dd className="font-medium text-ink">
                  {formatIDR(statusTotals[status] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
        <StatCard
          label={copy.budget.remainingBill}
          value={formatIDR(outstandingBill)}
          hint={overpaid ? copy.budget.overpaidWarning : undefined}
        />
        <Card className="flex flex-col justify-between gap-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {copy.budget.percentPaid}
          </p>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {paidPercent}%
            </p>
            <div className="mt-2">
              <Progress value={paidPercent} />
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {copy.vendors.totalPaid}: {formatIDR(committedPaid)}
              {committedPaid === 0 ? ` (${copy.budget.noPaymentYet})` : ""}
            </p>
          </div>
        </Card>
      </section>

      <Card>
        <TotalBudgetForm copy={copy} totalBudget={target} />
      </Card>

      <Card>
        <VendorGroups
          groups={groups}
          vendors={vendors}
          payments={payments}
          copy={copy}
          locale={locale}
          picOptions={picOptions}
        />
      </Card>
    </div>
  );
}
