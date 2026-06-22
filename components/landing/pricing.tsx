"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Check,
  LineChart,
  Minus,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { CONTAINER_CLASS, FadeIn } from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";

type ButtonVariant = "outline" | "secondary" | "gradient" | "dark";

type PricingPlan = {
  name: string;
  badge?: string;
  badgeStyle?: "free" | "popular";
  originalPrice?: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  buttonVariant: ButtonVariant;
  highlighted?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Free Trial",
    badge: "14 Days Free",
    badgeStyle: "free",
    price: "Free",
    features: [
      "1 User",
      "3 Campaigns/month",
      "10 Creators/month",
      "30 Tracked Contents/month",
      "Basic Campaign Analytics",
      "Advanced Performance Dashboard",
      "Campaign Comparison",
      "Creator Comparison",
    ],
    cta: "Start Free Trial",
    ctaHref: "#access",
    buttonVariant: "outline",
  },
  {
    name: "Starter",
    originalPrice: "IDR 1,099,000",
    price: "IDR 529,000",
    period: "/month",
    features: [
      "1 User",
      "10 Campaigns/month",
      "30 Creators/month",
      "60 Tracked Contents/month",
      "Basic Campaign Analytics",
    ],
    cta: "Get Started",
    ctaHref: "#access",
    buttonVariant: "secondary",
  },
  {
    name: "Growth",
    originalPrice: "IDR 2,999,000",
    price: "IDR 1,499,000",
    period: "/month",
    features: [
      "3 Users",
      "Unlimited Campaigns",
      "100 Creators/month",
      "300 Tracked Contents/month",
      "Bulk Uploads",
      "Basic Campaign Analytics",
      "Advanced Performance Dashboard",
    ],
    cta: "Start Growing",
    ctaHref: "#access",
    buttonVariant: "gradient",
    highlighted: true,
  },
  {
    name: "Scale",
    originalPrice: "IDR 4,990,000",
    price: "IDR 2,599,000",
    period: "/month",
    features: [
      "5 Users",
      "Unlimited Campaigns",
      "500 Creators/month",
      "1,500 Tracked Contents/month",
      "Bulk Uploads",
      "Content Planner",
      "Payout Management",
      "Custom Reports",
      "Priority Support",
    ],
    cta: "Start Scaling",
    ctaHref: "mailto:hello@kefoo.tech?subject=Scale%20Plan%20Inquiry",
    buttonVariant: "dark",
  },
];

type AddOn = {
  icon: LucideIcon;
  title: string;
  price: string;
  description: string;
};

const addOns: AddOn[] = [
  {
    icon: Users,
    title: "Additional User",
    price: "Rp50.000",
    description: "Add an extra team member to your workspace.",
  },
  {
    icon: Calendar,
    title: "Content Planner",
    price: "Rp15.000",
    description: "Plan, organize, and schedule content across campaigns.",
  },
  {
    icon: UserPlus,
    title: "Additional Creators",
    price: "Rp99.000",
    description: "Add 5 creator profiles.",
  },
  {
    icon: BarChart3,
    title: "Additional Tracked Contents",
    price: "Rp149.000",
    description: "Add 100 additional tracked contents.",
  },
  {
    icon: LineChart,
    title: "Performance Dashboard",
    price: "Rp150.000",
    description: "Unlock advanced performance reporting and analytics.",
  },
  {
    icon: Wallet,
    title: "Payout Tracking",
    price: "Rp199.000",
    description: "Manage creator payments and payout reminders.",
  },
];

type ComparisonValue = string | boolean;

const planColumns = ["Free Trial", "Starter", "Growth", "Scale"] as const;

const comparisonRows: { feature: string; values: ComparisonValue[] }[] = [
  {
    feature: "Subscription Price",
    values: ["Free", "IDR 529K/mo", "IDR 1.499M/mo", "IDR 2.599M/mo"],
  },
  { feature: "Duration", values: ["14 Days", "Monthly", "Monthly", "Monthly"] },
  { feature: "Users", values: ["1", "1", "3", "5"] },
  { feature: "Campaigns/month", values: ["3", "10", "Unlimited", "Unlimited"] },
  { feature: "Creators/month", values: ["10", "30", "100", "500"] },
  {
    feature: "Tracked Contents/month",
    values: ["30", "90", "300", "1,500"],
  },
  { feature: "Bulk Uploads", values: [false, false, true, true] },
  {
    feature: "Basic Campaign Analytics",
    values: [true, true, true, true],
  },
  {
    feature: "Advanced Performance Dashboard",
    values: [true, false, true, true],
  },
  { feature: "Content Planner", values: [false, false, false, true] },
  { feature: "Payout Management", values: [false, false, false, true] },
  { feature: "Custom Reports", values: [false, false, false, true] },
  { feature: "Priority Support", values: [false, false, false, true] },
];

function PlanBadge({
  label,
  style,
}: {
  label: string;
  style?: "free" | "popular";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        style === "popular" &&
          "border border-violet-400/30 bg-violet-500/10 text-violet-200",
        style === "free" &&
          "border border-white/10 bg-white/[0.04] text-slate-400",
      )}
    >
      {label}
    </span>
  );
}

function PricingButton({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: ReactNode;
  variant: ButtonVariant;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className={className}>
      <Link
        href={href}
        className={cn(
          "flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
          variant === "outline" &&
            "border border-white/15 bg-transparent text-white hover:border-white/25 hover:bg-white/[0.03]",
          variant === "secondary" &&
            "border border-white/[0.08] bg-white/[0.04] text-white hover:border-white/15 hover:bg-white/[0.06]",
          variant === "gradient" &&
            "border border-violet-400/20 bg-gradient-to-r from-[#6EA5F7]/90 to-[#A855F7]/90 text-white shadow-[0_4px_24px_-8px_rgba(74,134,232,0.4)] hover:shadow-[0_8px_32px_-8px_rgba(110,165,247,0.45)]",
          variant === "dark" &&
            "border border-white/10 bg-white/[0.05] text-white hover:border-white/20 hover:bg-white/[0.08]",
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function FeatureCheck({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06]">
        <Check className="h-3 w-3 text-slate-300" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center">
      <Minus className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
    </span>
  );
}

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (typeof value === "boolean") {
    return (
      <div className="flex justify-center">
        <FeatureCheck active={value} />
      </div>
    );
  }

  return <span className="text-sm text-slate-300">{value}</span>;
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const isHighlighted = plan.highlighted;

  return (
    <FadeIn delay={index * 0.07} className={cn(isHighlighted && "lg:z-10")}>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className={cn(
          "relative flex h-full flex-col rounded-[20px] border bg-white/[0.025] p-6 backdrop-blur-xl transition-shadow duration-300 sm:p-7",
          isHighlighted
            ? "border-violet-400/20 shadow-[0_0_48px_-16px_rgba(139,92,246,0.35)] hover:shadow-[0_0_56px_-12px_rgba(139,92,246,0.42)] lg:scale-[1.02] lg:py-8"
            : "border-white/[0.07] shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] hover:border-white/[0.1] hover:shadow-[0_12px_48px_-20px_rgba(0,0,0,0.55)]",
        )}
      >
        {isHighlighted ? (
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-b from-violet-500/[0.07] to-transparent" />
        ) : null}

        <div className="relative flex flex-1 flex-col">
          <div className="mb-6 flex min-h-[28px] flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-white">{plan.name}</h3>
            {plan.badge ? (
              <PlanBadge label={plan.badge} style={plan.badgeStyle} />
            ) : null}
          </div>

          <div className="mb-6">
            {plan.originalPrice ? (
              <p className="text-sm text-slate-500 line-through decoration-slate-600">
                {plan.originalPrice}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
              <span
                className={cn(
                  "font-semibold tracking-tight text-white",
                  plan.price === "Free" ? "text-3xl" : "text-[1.65rem] leading-none",
                )}
              >
                {plan.price}
              </span>
              {plan.period ? (
                <span className="text-sm font-normal text-slate-500">{plan.period}</span>
              ) : null}
            </div>
          </div>

          <ul className="flex-1 space-y-3 border-t border-white/[0.06] pt-6">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[13px] leading-snug text-slate-400">
                <Check
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    isHighlighted ? "text-violet-300/90" : "text-slate-500",
                  )}
                  strokeWidth={2.5}
                />
                {feature}
              </li>
            ))}
          </ul>

          <PricingButton
            href={plan.ctaHref}
            variant={plan.buttonVariant}
            className="mt-8"
          >
            {plan.cta}
          </PricingButton>
        </div>
      </motion.div>
    </FadeIn>
  );
}

function AddOnCard({ addOn, index }: { addOn: AddOn; index: number }) {
  const Icon = addOn.icon;

  return (
    <FadeIn delay={index * 0.05}>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className="group flex h-full flex-col rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-6 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-shadow duration-300 hover:border-white/[0.1] hover:shadow-[0_12px_48px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-4 inline-flex rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5 transition-colors group-hover:border-white/10 group-hover:bg-white/[0.06]">
          <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-300" strokeWidth={1.75} />
        </div>

        <h3 className="text-sm font-semibold tracking-tight text-white">{addOn.title}</h3>

        <div className="mt-3 flex items-baseline gap-0.5">
          <span className="text-xl font-semibold tracking-tight text-white">{addOn.price}</span>
          <span className="text-sm text-slate-500">/month</span>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{addOn.description}</p>
      </motion.div>
    </FadeIn>
  );
}

function AddOnsSection() {
  return (
    <div className="mt-20">
      <FadeIn>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Flexible Add-ons
          </span>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Scale as your team grows
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Expand your workspace without upgrading your entire plan.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addOns.map((addOn, index) => (
          <AddOnCard key={addOn.title} addOn={addOn} index={index} />
        ))}
      </div>
    </div>
  );
}

function ComparisonTable() {
  return (
    <FadeIn delay={0.2}>
      <div className="mt-20">
        <div className="mb-8 text-center sm:mb-10">
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Compare plans
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Every feature, side by side.
          </p>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.02] shadow-[0_8px_40px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="sticky left-0 z-20 min-w-[220px] bg-[#070b16]/95 px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500 backdrop-blur-md sm:px-6">
                    Feature
                  </th>
                  {planColumns.map((column, index) => (
                    <th
                      key={column}
                      className={cn(
                        "min-w-[120px] px-4 py-4 text-center text-xs font-medium uppercase tracking-wider sm:px-5",
                        index === 2
                          ? "bg-violet-500/[0.06] text-violet-200"
                          : "text-slate-500",
                      )}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, rowIndex) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-white/[0.05] last:border-0",
                      rowIndex % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-[#070b16]/95 px-5 py-3.5 text-sm text-slate-400 backdrop-blur-md sm:px-6">
                      {row.feature}
                    </td>
                    {row.values.map((value, colIndex) => (
                      <td
                        key={`${row.feature}-${colIndex}`}
                        className={cn(
                          "px-4 py-3.5 text-center sm:px-5",
                          colIndex === 2 && "bg-violet-500/[0.04]",
                        )}
                      >
                        <ComparisonCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.08), transparent), radial-gradient(ellipse 40% 30% at 80% 70%, rgba(110,165,247,0.05), transparent)",
        }}
      />

      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Simple pricing for creator campaign teams
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
              Track creators, analyze campaign performance, and manage influencer
              operations in one platform.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch xl:gap-4">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        <AddOnsSection />

        <ComparisonTable />
      </div>
    </section>
  );
}
