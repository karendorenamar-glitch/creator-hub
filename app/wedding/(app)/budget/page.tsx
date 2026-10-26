import Link from "next/link";
import { redirect } from "next/navigation";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { TargetBudgetStatusCard } from "@/components/wedding/budget/target-budget-status";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadBudgetData } from "@/lib/wedding/budget-data";
import { formatIDR } from "@/lib/wedding/format";
import { moduleCopy } from "@/lib/wedding/module-copy";
import { loadWeddingSession } from "@/lib/wedding/session";

export const metadata = { title: "Anggaran Menikah" };

export default async function BudgetPage() {
  const session = await loadWeddingSession();
  if (!session) redirect("/wedding/onboarding");

  const locale = await getLocale();
  const copy = moduleCopy[locale];
  const targetBudget = Number(session.wedding.total_budget ?? 0);
  const data = await loadBudgetData(session.wedding.id, targetBudget);
  const { calc } = data;

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
          label={copy.budget.totalPaid}
          value={formatIDR(calc.totalPaid)}
          tone="champagne"
        />
        <StatCard
          label={copy.budget.remainingPayment}
          value={formatIDR(calc.remainingPayment)}
        />
        <StatCard
          label={copy.budget.overpayment}
          value={formatIDR(calc.overpayment)}
          tone={calc.overpayment > 0 ? "champagne" : undefined}
        />
      </section>

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
        {calc.overpayment > 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {copy.budget.overpaidWarning}: {formatIDR(calc.overpayment)}
          </p>
        ) : null}
      </Card>

      <Link
        href="/wedding/vendors"
        className="inline-flex text-sm font-medium text-olive-700 hover:underline"
      >
        {copy.budget.manageVendors}
      </Link>
    </div>
  );
}
