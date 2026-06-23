import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PaidPlanSignupPage } from "@/components/signup/paid-plan-signup-page";
import {
  CHECKOUT_PLAN_CONFIG,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ plan: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plan: planParam } = await params;

  if (!isCheckoutPlan(planParam)) {
    return { title: "Sign Up — Kefoo" };
  }

  const plan = planParam as CheckoutPlan;
  const config = CHECKOUT_PLAN_CONFIG[plan];

  return {
    title: `Sign Up — ${config.name} — Kefoo`,
    description: `Create your Kefoo account and subscribe to the ${config.name} plan.`,
  };
}

export default async function PaidPlanSignupRoute({ params }: PageProps) {
  const { plan: planParam } = await params;

  if (!isCheckoutPlan(planParam)) {
    notFound();
  }

  const plan = planParam as CheckoutPlan;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/checkout/${plan}`);
  }

  return <PaidPlanSignupPage plan={plan} />;
}
