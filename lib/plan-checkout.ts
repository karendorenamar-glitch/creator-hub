import type { OrgPlan } from "@/lib/plan";

export type CheckoutPlan = Extract<OrgPlan, "starter" | "growth" | "scale">;

export const CHECKOUT_PLANS: CheckoutPlan[] = ["starter", "growth", "scale"];

export type CheckoutPlanConfig = {
  plan: CheckoutPlan;
  name: string;
  priceLabel: string;
  amountIdr: number;
  periodLabel: string;
  cta: string;
  features: string[];
};

export const CHECKOUT_PLAN_CONFIG: Record<CheckoutPlan, CheckoutPlanConfig> = {
  starter: {
    plan: "starter",
    name: "Starter",
    priceLabel: "IDR 529,000",
    amountIdr: 529_000,
    periodLabel: "/month",
    cta: "Get Started",
    features: [
      "1 user",
      "10 campaigns/month",
      "30 creators/month",
      "60 tracked contents/month",
      "Basic campaign analytics",
    ],
  },
  growth: {
    plan: "growth",
    name: "Growth",
    priceLabel: "IDR 1,499,000",
    amountIdr: 1_499_000,
    periodLabel: "/month",
    cta: "Start Growing",
    features: [
      "3 users",
      "Unlimited campaigns",
      "100 creators/month",
      "300 tracked contents/month",
      "Bulk uploads",
      "Advanced performance dashboard",
    ],
  },
  scale: {
    plan: "scale",
    name: "Scale",
    priceLabel: "IDR 2,599,000",
    amountIdr: 2_599_000,
    periodLabel: "/month",
    cta: "Start Scaling",
    features: [
      "5 users",
      "Unlimited campaigns",
      "500 creators/month",
      "1,500 tracked contents/month",
      "Bulk uploads",
      "Payout management",
      "Custom reports",
      "Priority support",
    ],
  },
};

export const PAYMENT_BANK_DETAILS = {
  bankName: "BCA",
  accountName: "Karen Dorena Mardini",
  accountNumber: "2780205299",
} as const;

export function getPaymentInstructions(plan: CheckoutPlan) {
  const { priceLabel, name } = CHECKOUT_PLAN_CONFIG[plan];

  return [
    `Transfer exactly ${priceLabel} for the ${name} plan.`,
    "Use your workspace name as the transfer note if possible.",
    "Upload your transfer receipt below after payment.",
  ];
}

export function getPaymentQrUrl() {
  return process.env.NEXT_PUBLIC_PAYMENT_QR_URL?.trim() || null;
}

export function isCheckoutPlan(value: string): value is CheckoutPlan {
  return CHECKOUT_PLANS.includes(value as CheckoutPlan);
}

export function getCheckoutSignupPath(plan: CheckoutPlan) {
  return `/signup/${plan}`;
}

export function getPaidPlanSignupPath(plan: CheckoutPlan) {
  return `/signup/${plan}`;
}

const PLAN_RANK: Record<OrgPlan, number> = {
  free_trial: 0,
  starter: 1,
  growth: 2,
  scale: 3,
};

export function isPlanAtLeast(current: OrgPlan, target: CheckoutPlan) {
  return PLAN_RANK[current] >= PLAN_RANK[target];
}

export function formatOrgPlanLabel(plan: OrgPlan) {
  const labels: Record<OrgPlan, string> = {
    free_trial: "Free Trial",
    starter: "Starter",
    growth: "Growth",
    scale: "Scale",
  };

  return labels[plan];
}

export function formatCheckoutPlanLabel(plan: CheckoutPlan) {
  return CHECKOUT_PLAN_CONFIG[plan].name;
}

export function formatPaymentSubmissionStatus(
  status: "pending" | "approved" | "rejected",
) {
  switch (status) {
    case "pending":
      return "Pending verification";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}
