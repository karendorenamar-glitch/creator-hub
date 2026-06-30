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
import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import { getPaidPlanSignupPath } from "@/lib/plan-checkout";
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
    badge: "30 Days Free",
    badgeStyle: "free",
    price: "Free",
    features: [
      "1 User",
      "3 Campaigns/month",
      "10 Creators/month",
      "15 Tracked Contents/month",
      "Basic Campaign Analytics",
    ],
    cta: "Start Free Trial",
    ctaHref: "/login?signup=1",
    buttonVariant: "outline",
  },
  {
    name: "Starter",
    originalPrice: "IDR 1,099,000",
    price: "IDR 815,000",
    period: "/month",
    features: [
      "1 User",
      "10 Campaigns/month",
      "30 Creators/month",
      "60 Live Content/month",
      "Bulk Uploads",
      "Basic Campaign Analytics",
    ],
    cta: "Get Started",
    ctaHref: getPaidPlanSignupPath("starter"),
    buttonVariant: "secondary",
  },
  {
    name: "Scale",
    badge: "Most Popular",
    badgeStyle: "popular",
    originalPrice: "IDR 2,999,000",
    price: "IDR 1,799,000",
    period: "/month",
    features: [
      "3 Users",
      "Unlimited Campaigns",
      "100 Creators/month",
      "300 Live Content/month",
      "Bulk Uploads",
      "Discover video via keywords",
      "Basic Campaign Analytics",
      "Advanced Performance Dashboard",
      "Payout Management",
      "Export CSV",
    ],
    cta: "Start Scaling",
    ctaHref: getPaidPlanSignupPath("scale"),
    buttonVariant: "gradient",
    highlighted: true,
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
    price: "Rp79.000",
    description: "Add 1 extra team member to your workspace.",
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
    price: "Rp149.000",
    description: "Add 50 creator profiles.",
  },
  {
    icon: BarChart3,
    title: "Additional Tracked Contents",
    price: "Rp169.000",
    description: "Add 100 additional tracked contents.",
  },
  {
    icon: LineChart,
    title: "Advanced Performance Dashboard",
    price: "Rp149.000",
    description: "Unlock advanced performance reporting and analytics.",
  },
  {
    icon: Wallet,
    title: "Payout Tracking",
    price: "Rp149.000",
    description: "Manage creator payments and payout reminders.",
  },
];

type ComparisonValue = string | boolean;

const planColumns = ["Free Trial", "Starter", "Scale"] as const;

const comparisonRows: { feature: string; values: ComparisonValue[] }[] = [
  { feature: "Users", values: ["1", "1", "3"] },
  { feature: "Campaigns/month", values: ["3", "10", "Unlimited"] },
  { feature: "Creators/month", values: ["10", "30", "100"] },
  {
    feature: "Live Content/month",
    values: ["15", "60", "300"],
  },
  { feature: "Bulk Uploads", values: [false, true, true] },
  {
    feature: "Basic Campaign Analytics",
    values: [true, true, true],
  },
  {
    feature: "Discover video via keywords",
    values: [false, false, true],
  },
  {
    feature: "Advanced Performance Dashboard",
    values: [false, false, true],
  },
  { feature: "Content Planner", values: [false, false, false] },
  { feature: "Payout Management", values: [false, false, true] },
  { feature: "Export CSV", values: [false, false, true] },
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
          "border border-kefoo-400/30 bg-kefoo-500/10 text-kefoo-200",
        style === "free" &&
          "border border-slate-200/80 bg-white text-slate-600",
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
            "border border-slate-300 bg-transparent text-slate-900 hover:border-slate-300 hover:bg-white/90",
          variant === "secondary" &&
            "border border-slate-200/80 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
          variant === "gradient" &&
            "border border-kefoo-300/40 bg-gradient-to-r from-kefoo-200 via-kefoo-300 to-kefoo-400 text-white shadow-[0_4px_20px_-8px_rgba(74,74,74,0.35)] hover:shadow-[0_8px_28px_-8px_rgba(74,74,74,0.4)]",
          variant === "dark" &&
            "border border-slate-200/80 bg-white text-slate-900 hover:border-slate-300 hover:bg-white/[0.08]",
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
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-50">
        <Check className="h-3 w-3 text-slate-500" strokeWidth={2.5} />
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

  return <span className="text-sm text-slate-500">{value}</span>;
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const isHighlighted = plan.highlighted;

  return (
    <FadeIn delay={index * 0.07} className={cn(isHighlighted && "lg:z-10")}>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
        className={cn(
          "relative flex h-full flex-col rounded-[20px] border bg-white/95 p-6 backdrop-blur-xl transition-shadow duration-300 sm:p-7",
          isHighlighted
            ? "landing-card-frame border-kefoo-400/20 shadow-[0_0_48px_-16px_rgba(74,74,74,0.35)] hover:shadow-[0_0_56px_-12px_rgba(74,74,74,0.42)] lg:scale-[1.02] lg:py-8"
            : "border-slate-200/80 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] hover:border-white/[0.1] hover:shadow-[0_12px_48px_-20px_rgba(0,0,0,0.55)]",
        )}
      >
        {isHighlighted ? (
          <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-b from-kefoo-500/[0.07] to-transparent" />
        ) : null}

        <div className="relative flex flex-1 flex-col">
          <div className="mb-6 flex min-h-[28px] flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-slate-900">{plan.name}</h3>
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
                  "font-semibold tracking-tight text-slate-900",
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

          <ul className="flex-1 space-y-3 border-t border-slate-200/70 pt-6">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-[13px] leading-snug text-slate-600">
                <Check
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    isHighlighted ? "text-kefoo-300/90" : "text-slate-500",
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
        className="group flex h-full flex-col rounded-[20px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-shadow duration-300 hover:border-white/[0.1] hover:shadow-[0_12px_48px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-4 inline-flex rounded-xl border border-slate-200/70 bg-white p-2.5 transition-colors group-hover:border-slate-200/80 group-hover:bg-slate-50">
          <Icon className="h-4 w-4 text-slate-600 group-hover:text-slate-500" strokeWidth={1.75} />
        </div>

        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{addOn.title}</h3>

        <div className="mt-3 flex items-baseline gap-0.5">
          <span className="text-xl font-semibold tracking-tight text-slate-900">{addOn.price}</span>
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
          <span className="inline-flex rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Flexible Add-ons
          </span>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Scale as your team grows
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Expand your workspace without upgrading your entire plan.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addOns
          .filter(
            (addOn) =>
              CONTENT_PLANNER_ENABLED || addOn.title !== "Content Planner",
          )
          .map((addOn, index) => (
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
          <h3 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Compare plans
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Every feature, side by side.
          </p>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/85 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white/85">
                  <th className="sticky left-0 z-20 min-w-[220px] bg-white/95 px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500 backdrop-blur-md sm:px-6">
                    Feature
                  </th>
                  {planColumns.map((column, index) => (
                    <th
                      key={column}
                      className={cn(
                        "min-w-[120px] px-4 py-4 text-center text-xs font-medium uppercase tracking-wider sm:px-5",
                        index === 2
                          ? "bg-kefoo-500/[0.06] text-kefoo-200"
                          : "text-slate-500",
                      )}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows
                  .filter(
                    (row) =>
                      CONTENT_PLANNER_ENABLED ||
                      row.feature !== "Content Planner",
                  )
                  .map((row, rowIndex) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-slate-200/60 last:border-0",
                      rowIndex % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-white/95 px-5 py-3.5 text-sm text-slate-600 backdrop-blur-md sm:px-6">
                      {row.feature}
                    </td>
                    {row.values.map((value, colIndex) => (
                      <td
                        key={`${row.feature}-${colIndex}`}
                        className={cn(
                          "px-4 py-3.5 text-center sm:px-5",
                          colIndex === 2 && "bg-kefoo-500/[0.04]",
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
      <div className="landing-section-muted pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full border border-slate-200/25" />
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="hidden h-px w-12 bg-gradient-to-r from-transparent to-slate-200 sm:block" />
              <span className="h-1.5 w-1.5 rounded-full bg-kefoo-400/60" />
              <span className="hidden h-px w-12 bg-gradient-to-l from-transparent to-slate-200 sm:block" />
            </div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Pick a plan and launch effortlessly
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
              Transparent pricing. Start on a free trial, upgrade when your team
              is ready — no sales call required.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:items-stretch xl:gap-4">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={{
                ...plan,
                features: plan.features.filter(
                  (feature) =>
                    CONTENT_PLANNER_ENABLED || feature !== "Content Planner",
                ),
              }}
              index={index}
            />
          ))}
        </div>

        <AddOnsSection />

        <ComparisonTable />
      </div>
    </section>
  );
}