import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader, StatCard } from "@/components/wedding/ui";
import { VendorList } from "@/components/wedding/vendors/vendor-list";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadVendorsPageData } from "@/lib/wedding/budget-data";
import { formatIDR } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Vendor" };

export default async function VendorsPage() {
  const [session, locale] = await Promise.all([
    loadWeddingSession(),
    getLocale(),
  ]);
  if (!session) redirect("/wedding/onboarding");
  const copy = moduleCopy[locale];
  const data = await loadVendorsPageData(session.wedding.id, 0);
  const { calc } = data;

  return (
    <div className="space-y-7">
      <PageHeader
        title={copy.vendors.title}
        subtitle={copy.vendors.confirmedSubtitle}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.vendors.vendorBudget}
          value={formatIDR(calc.vendorBudget)}
        />
        <StatCard
          label={copy.vendors.totalPaid}
          value={formatIDR(calc.totalPaid)}
          tone="champagne"
        />
        <StatCard
          label={copy.vendors.remainingPayment}
          value={formatIDR(calc.remainingPayment)}
        />
        <StatCard
          label={copy.vendors.overpayment}
          value={formatIDR(calc.overpayment)}
          tone={calc.overpayment > 0 ? "champagne" : undefined}
        />
      </section>

      {!calc.vendorBudgetComplete ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <p className="text-sm font-medium text-amber-900">
            {copy.vendors.budgetIncomplete.replace(
              "{count}",
              String(calc.missingAgreedPriceCount),
            )}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {copy.vendors.budgetIncompleteHint}
          </p>
        </Card>
      ) : null}

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
        />
      </Card>

      <Link
        href="/wedding/budget"
        className="inline-flex text-sm font-medium text-olive-700 hover:underline"
      >
        {copy.vendors.openBudget}
      </Link>
    </div>
  );
}
