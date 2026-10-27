import { redirect } from "next/navigation";
import { DonationManager, DonationNote } from "@/components/wedding/budget/donation-manager";
import { OtherCostManager } from "@/components/wedding/budget/other-cost-manager";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { TargetBudgetStatusCard } from "@/components/wedding/budget/target-budget-status";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { VendorList } from "@/components/wedding/vendors/vendor-list";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadVendorsPageData } from "@/lib/wedding/budget-data";
import { formatIDR } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import type { VendorOptionPrefill } from "@/lib/wedding/vendor-options";

export const metadata = { title: "Anggaran Menikah" };

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorOption?: string; vendor?: string }>;
}) {
  const [session, locale, params] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
    searchParams,
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const targetBudget = Number(session.wedding.total_budget ?? 0);
  const data = await loadVendorsPageData(session.wedding.id, targetBudget);
  const { calc } = data;

  // Pilih Vendor only prefills this existing form. Nothing is created until
  // the user reviews and submits it.
  let prefill: VendorOptionPrefill | null = null;
  let initialVendorId = params.vendor ?? null;
  if (params.vendorOption) {
    const supabase = await createWeddingClient();
    const { data: option } = await supabase
      .from("vendor_options")
      .select("id, vendor_name, category, reference_price, selected_vendor_id")
      .eq("id", params.vendorOption)
      .eq("wedding_id", session.wedding.id)
      .maybeSingle();

    if (option) {
      if (option.selected_vendor_id) {
        initialVendorId = option.selected_vendor_id;
      } else {
        prefill = {
          optionId: option.id,
          name: option.vendor_name,
          category: option.category,
          referencePrice: option.reference_price,
        };
      }
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader title={copy.budget.title} subtitle={copy.budget.subtitle} />

      <section className="space-y-4">
        <Card>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
            {copy.budget.targetBudget}
          </p>
          <TotalBudgetForm copy={copy} totalBudget={targetBudget} />
        </Card>

        <TargetBudgetStatusCard
          status={calc.targetStatus}
          difference={calc.targetDifference}
          targetBudget={calc.targetBudget}
          vendorBudget={calc.vendorBudget}
          otherCostsTotal={calc.otherCostsTotal}
          missingAgreedPriceCount={calc.missingAgreedPriceCount}
          copy={copy}
        />
      </section>

      {!calc.vendorBudgetComplete ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-sm font-medium text-amber-900">
            {copy.budget.budgetIncomplete.replace(
              "{count}",
              String(calc.missingAgreedPriceCount),
            )}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {copy.budget.budgetIncompleteHint}
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.budget.vendorBudget}
          value={formatIDR(calc.vendorBudget)}
        />
        <StatCard
          label={copy.budget.otherCostsTotal}
          value={formatIDR(calc.otherCostsTotal)}
          tone={calc.otherCostsTotal > 0 ? "champagne" : undefined}
        />
        <StatCard
          label={copy.budget.totalPaid}
          value={formatIDR(calc.totalPaid)}
          tone="champagne"
        />
        <StatCard
          label={copy.budget.remainingPayment}
          value={formatIDR(calc.remainingPayment)}
        >
          <DonationNote
            donations={data.donations}
            total={calc.donationsTotal}
            excess={calc.donationExcess}
            copy={copy}
          />
        </StatCard>
      </section>

      <DonationManager
        donations={data.donations}
        schemaReady={data.donationSchemaReady}
        copy={copy}
      />

      <Card className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
              {copy.budget.paymentPercentage}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {calc.paymentPercentage}%
            </p>
          </div>
          <p className="text-xs text-ink-soft">
            {copy.budget.totalPaid}: {formatIDR(calc.totalPaid)}
          </p>
        </div>
        <Progress value={calc.paymentPercentage} />
      </Card>

      <Card className="border-olive-100 bg-olive-50/50">
        <p className="text-xs leading-relaxed text-ink-soft">
          {copy.budget.autoCalculatedInfo}
        </p>
      </Card>

      <Card className="space-y-4">
        <VendorList
          activeVendors={calc.activeVendors}
          archivedVendors={calc.archivedVendors}
          payments={data.payments}
          proofs={data.proofs}
          proofUrls={data.proofUrls}
          summaryByVendor={Object.fromEntries(calc.summaryByVendor)}
          copy={copy}
          locale={locale}
          prefill={prefill}
          initialVendorId={initialVendorId}
        />
      </Card>

      <Card className="space-y-4">
        <OtherCostManager otherCosts={data.otherCosts} copy={copy} />
      </Card>
    </div>
  );
}
