import { notFound } from "next/navigation";
import { logCheckoutPlanView } from "@/app/actions/plan-checkout";
import { getLatestPaymentSubmissionForOrg } from "@/app/actions/payment-submissions";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getOrganizationSettings } from "@/app/actions/org";
import { getAuthUser } from "@/lib/org";
import { PlanCheckoutSection } from "@/components/checkout/plan-checkout-section";
import { Header } from "@/components/layout/header";
import {
  CHECKOUT_PLAN_CONFIG,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/lib/plan-checkout";

type CheckoutPageProps = {
  params: Promise<{ plan: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { plan: planParam } = await params;

  if (!isCheckoutPlan(planParam)) {
    notFound();
  }

  const plan = planParam as CheckoutPlan;
  const config = CHECKOUT_PLAN_CONFIG[plan];

  await logCheckoutPlanView(plan);

  const [planContext, organizationResult, submissionResult, user] =
    await Promise.all([
      getDashboardPlanContext(),
      getOrganizationSettings(),
      getLatestPaymentSubmissionForOrg(),
      getAuthUser(),
    ]);

  const organization =
    "data" in organizationResult ? organizationResult.data : null;

  if (!organization) {
    notFound();
  }

  const latestSubmission =
    ("data" in submissionResult ? submissionResult.data : null) ?? null;

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const accountName = metadataName || organization.name;

  return (
    <>
      <Header
        title={`Upgrade to ${config.name}`}
        description={`Hi ${accountName}, please proceed your payment.`}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <PlanCheckoutSection
            plan={plan}
            currentPlan={planContext.plan}
            orgId={organization.id}
            orgName={organization.name}
            accountName={accountName}
            latestSubmission={latestSubmission}
          />
        </div>
      </main>
    </>
  );
}
