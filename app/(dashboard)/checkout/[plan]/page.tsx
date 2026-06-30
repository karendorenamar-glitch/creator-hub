import { notFound, redirect } from "next/navigation";
import { logCheckoutPlanView } from "@/app/actions/plan-checkout";
import { getLatestPaymentSubmissionForOrg } from "@/app/actions/payment-submissions";
import { getDashboardPlanContext } from "@/app/actions/plan";
import { getOrganizationSettings } from "@/app/actions/org";
import { getAuthUser } from "@/lib/org";
import { isWithinRenewEarlyWindow, normalizeOrgPlan } from "@/lib/plan";
import { PlanCheckoutSection } from "@/components/checkout/plan-checkout-section";
import { Header } from "@/components/layout/header";
import {
  CHECKOUT_PLAN_CONFIG,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import type { PlanContext } from "@/lib/plan";

function isPaidRenewalCheckout(
  planContext: PlanContext,
  checkoutPlan: CheckoutPlan,
) {
  return (
    !planContext.isFreeTrial &&
    normalizeOrgPlan(planContext.plan) === checkoutPlan
  );
}

type CheckoutPageProps = {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ renew?: string }>;
};

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { plan: planParam } = await params;
  const { renew } = await searchParams;
  const renewEarly = renew === "early";

  if (planParam === "growth") {
    const renewSuffix = renewEarly ? "?renew=early" : "";
    redirect(`/checkout/scale${renewSuffix}`);
  }

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

  const isRenewEarlyCheckout =
    renewEarly &&
    isPaidRenewalCheckout(planContext, plan) &&
    isWithinRenewEarlyWindow(planContext.subscriptionEndsAt);

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const accountName = metadataName || organization.name;

  return (
    <>
      <Header
        title={
          isRenewEarlyCheckout
            ? `Renew your ${config.name} plan`
            : `${config.name} plan payment`
        }
        description={`Hi ${accountName}, please proceed your payment.`}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <PlanCheckoutSection
            plan={plan}
            currentPlan={planContext.plan}
            orgId={organization.id}
            accountName={accountName}
            latestSubmission={latestSubmission}
            renewEarly={isRenewEarlyCheckout}
          />
        </div>
      </main>
    </>
  );
}
