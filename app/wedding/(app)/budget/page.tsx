import { redirect } from "next/navigation";
import { DonationManager } from "@/components/wedding/budget/donation-manager";
import { OtherCostManager } from "@/components/wedding/budget/other-cost-manager";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { TotalCostCard } from "@/components/wedding/budget/total-cost-card";
import { Card, PageHeader, Progress } from "@/components/wedding/ui";
import type { TargetBudgetStatus } from "@/lib/wedding/budget-calc";
import { VendorList } from "@/components/wedding/vendors/vendor-list";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadVendorsPageData } from "@/lib/wedding/budget-data";
import { formatIDR } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import type { VendorOptionPrefill } from "@/lib/wedding/vendor-options";

function targetStatusLabel(status: TargetBudgetStatus, copy: typeof moduleCopy.id) {
  switch (status) {
    case "under":
      return copy.budget.targetUnder;
    case "on":
      return copy.budget.targetOn;
    case "over":
      return copy.budget.targetOver;
    case "provisional":
      return copy.budget.targetProvisional;
    default:
      return copy.budget.targetUnset;
  }
}

function targetStatusDetail(
  status: TargetBudgetStatus,
  difference: number | null,
  missingAgreedPriceCount: number,
  copy: typeof moduleCopy.id,
) {
  if (status === "under" && difference !== null) {
    return copy.budget.targetUnderDetail.replace("{amount}", formatIDR(difference));
  }
  if (status === "over" && difference !== null) {
    return copy.budget.targetOverDetail.replace("{amount}", formatIDR(difference));
  }
  if (status === "on") return copy.budget.targetOnDetail;
  if (status === "provisional") {
    return copy.budget.targetProvisionalDetail.replace(
      "{count}",
      String(missingAgreedPriceCount),
    );
  }
  return copy.budget.targetUnsetDetail;
}

function targetStatusClass(status: TargetBudgetStatus) {
  switch (status) {
    case "under":
      return "border-olive-200 bg-olive-50 text-olive-900";
    case "on":
      return "border-champagne/70 bg-champagne/20 text-cocoa";
    case "over":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "provisional":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-olive-100 bg-cream text-ink-soft";
  }
}

export const metadata = { title: "Anggaran Pernikahan" };

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

  const totalCost = calc.vendorBudget + calc.otherCostsTotal;
  const statusDetail = targetStatusDetail(
    calc.targetStatus,
    calc.targetDifference,
    calc.missingAgreedPriceCount,
    copy,
  );

  return (
    <div className="space-y-7">
      <PageHeader title={copy.budget.title} subtitle={copy.budget.subtitle} />

      <Card className="overflow-hidden border-petal-100 bg-gradient-to-br from-white via-cream/70 to-petal-50/60 p-0">
        <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.72fr)]">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-petal-500">
                {copy.budget.targetBudget}
              </p>
              <TotalBudgetForm copy={copy} totalBudget={targetBudget} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {copy.budget.targetBudget}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {formatIDR(targetBudget)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {copy.budget.totalCost}
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {formatIDR(totalCost)}
                </p>
              </div>
            </div>
          </div>

          <div className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 ${targetStatusClass(calc.targetStatus)}`}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-70">
                {copy.budget.targetStatus}
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold">
                {targetStatusLabel(calc.targetStatus, copy)}
              </p>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                {statusDetail}
              </p>
            </div>
          </div>
        </div>
      </Card>

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

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Card className="relative overflow-hidden border-[#EAE0D7] bg-[#FBF7F2] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-[#F2E2E2]/70" />
          <div className="relative">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#796779]">
              {copy.budget.sisaPerluDisiapkan}
            </p>
            <p className="mt-3 font-heading text-4xl leading-none tracking-tight text-[#49463F] sm:text-5xl">
              {formatIDR(calc.sisaPerluDisiapkan)}
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-[#888176]">
              {copy.budget.sisaHint}
            </p>
            <div className="mt-7 border-t border-[#EAE0D7] pt-4 text-xs text-[#888176]">
              <p>{copy.budget.sisaTagihan}</p>
              <p className="mt-1 font-medium text-[#49463F]">
                {formatIDR(calc.sisaTagihan)}
              </p>
            </div>
            {calc.donationShortfall > 0 ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                {copy.budget.donationShortfall}: {formatIDR(calc.donationShortfall)}
              </p>
            ) : null}
            <div className="mt-6">
              <div className="mb-2 flex items-end justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#796779]">
                  {copy.budget.paymentProgress}
                </span>
                <span className="font-heading text-xl text-[#49463F]">
                  {calc.paymentPercentage}%
                </span>
              </div>
              <Progress value={calc.paymentPercentage} tone="olive" />
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[#888176]">
                <span>{copy.budget.cashPaid}: {formatIDR(calc.cashPaid)}</span>
                <span>{copy.budget.totalCost}: {formatIDR(totalCost)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <TotalCostCard
            totalCost={totalCost}
            vendorBudget={calc.vendorBudget}
            otherCostsTotal={calc.otherCostsTotal}
            copy={copy}
          />
          <Card className="p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
              {copy.budget.cashPaid}
            </p>
            <p className="mt-2 font-heading text-2xl text-ink">
              {formatIDR(calc.cashPaid)}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{copy.budget.cashPaidHint}</p>
          </Card>
        </div>
      </section>

      <DonationManager
        donations={data.donations}
        schemaReady={data.donationSchemaReady}
        allocations={data.allocations}
        categories={data.categories}
        allocationSchemaReady={data.allocationSchemaReady}
        copy={copy}
      />

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
