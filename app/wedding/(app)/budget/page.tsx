import { redirect } from "next/navigation";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { VendorGroups } from "@/components/wedding/vendors/vendor-groups";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatIDR, percentOf } from "@/lib/wedding/format";
import { label } from "@/lib/wedding/labels";
import { moduleCopy } from "@/lib/wedding/module-copy";
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

  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const paidByVendor = new Map<string, number>();
  for (const payment of payments) {
    paidByVendor.set(
      payment.vendor_id,
      (paidByVendor.get(payment.vendor_id) ?? 0) + Number(payment.amount),
    );
  }

  // Committed cost = agreed price (fallback quoted) of the SELECTED option only.
  let committedCost = 0;
  let committedPaid = 0;
  let unknownPriceGroups = 0;

  for (const group of groups) {
    const selected = group.selected_vendor_id
      ? vendorById.get(group.selected_vendor_id)
      : null;
    if (!selected) continue;

    const price =
      selected.agreed_price ?? selected.quoted_price ?? null;
    if (price === null) {
      unknownPriceGroups += 1;
    } else {
      committedCost += Number(price);
    }
    committedPaid += paidByVendor.get(selected.id) ?? 0;
  }

  const target = Number(session.wedding.total_budget ?? 0);
  const remaining = target - committedCost;
  const paidPercent = percentOf(committedPaid, committedCost);
  const overBudget = target > 0 && committedCost > target;

  const statusCounts = { diskusi: 0, dp: 0, lunas: 0 } as Record<string, number>;
  for (const group of groups) {
    statusCounts[group.status] = (statusCounts[group.status] ?? 0) + 1;
  }

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
        <StatCard
          label={copy.budget.vendorCommitments}
          value={formatIDR(committedCost)}
          tone="champagne"
          hint={
            unknownPriceGroups > 0
              ? `${unknownPriceGroups} ${copy.vendors.priceUnknown}`
              : undefined
          }
        />
        <StatCard
          label={copy.budget.remaining}
          value={formatIDR(remaining)}
          hint={overBudget ? copy.budget.overBudget : undefined}
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
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {(["diskusi", "dp", "lunas"] as const).map((status) => (
          <StatCard
            key={status}
            label={label("paymentStatus", status, locale)}
            value={String(statusCounts[status] ?? 0)}
            hint={copy.vendors.groupsTitle}
            tone={status === "lunas" ? "champagne" : "blush"}
          />
        ))}
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
