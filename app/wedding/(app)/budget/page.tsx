import { redirect } from "next/navigation";
import { TotalBudgetForm } from "@/components/wedding/budget/total-budget-form";
import { VendorManager } from "@/components/wedding/vendors/vendor-manager";
import { Card, PageHeader, Progress, StatCard } from "@/components/wedding/ui";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatIDR, percentOf } from "@/lib/wedding/format";
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

  const [vendorsResult, paymentsResult] = await Promise.all([
    supabase.from("vendors").select("*").order("name", { ascending: true }),
    supabase
      .from("vendor_payments")
      .select("*")
      .order("paid_on", { ascending: false }),
  ]);

  const vendors = vendorsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const proofPaths = payments
    .map((payment) => payment.proof_path)
    .filter((path): path is string => Boolean(path));

  const proofUrls: Record<string, string> = {};
  if (proofPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrls(proofPaths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) proofUrls[item.path] = item.signedUrl;
    }
  }

  const totalBudget = Number(session.wedding.total_budget ?? 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = totalBudget - totalPaid;
  const paidPercent = percentOf(totalPaid, totalBudget);

  const vendorCommitments = vendors.reduce(
    (sum, vendor) =>
      sum + Number(vendor.agreed_price ?? vendor.quoted_price ?? 0),
    0,
  );
  const vendorOutstanding = Math.max(0, vendorCommitments - totalPaid);

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
        <StatCard
          label={copy.budget.totalBudget}
          value={formatIDR(totalBudget)}
        />
        <StatCard
          label={copy.budget.paidTotal}
          value={formatIDR(totalPaid)}
          tone="champagne"
        />
        <StatCard
          label={copy.budget.remaining}
          value={formatIDR(remaining)}
          hint={remaining < 0 ? copy.budget.overBudget : undefined}
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
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={copy.budget.vendorCommitments}
          value={formatIDR(vendorCommitments)}
          tone="champagne"
        />
        <StatCard
          label={copy.budget.vendorOutstanding}
          value={formatIDR(vendorOutstanding)}
        />
      </section>

      <Card>
        <TotalBudgetForm copy={copy} totalBudget={totalBudget} />
      </Card>

      <Card>
        <VendorManager
          vendors={vendors}
          payments={payments}
          proofUrls={proofUrls}
          copy={copy}
          locale={locale}
          picOptions={picOptions}
        />
      </Card>
    </div>
  );
}
