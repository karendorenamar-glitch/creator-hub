"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  Folder,
  LineChart,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  CONTAINER_CLASS,
  FadeIn,
  GradientText,
} from "@/components/landing/landing-shared";
import { cn } from "@/lib/utils";

type ButtonVariant = "outline" | "secondary" | "gradient" | "dark";

type PricingPlan = {
  name: string;
  badge?: string;
  badgeStyle?: "default" | "free" | "popular";
  originalPrice?: string;
  price: string;
  period?: string;
  subtitle?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  buttonVariant: ButtonVariant;
  highlighted?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Explore",
    badge: "Free Trial",
    badgeStyle: "free",
    price: "Free",
    subtitle: "14 days free access",
    description: "Perfect for exploring the platform.",
    features: [
      "1 User",
      "1 Campaign / month",
      "5 Creators / month",
      "10 Tracked Contents / month",
      "Content Planner",
      "Creator CRM",
      "Basic Tracking",
    ],
    cta: "Start Free Trial",
    ctaHref: "#access",
    buttonVariant: "outline",
  },
  {
    name: "Starter",
    originalPrice: "Rp359.000",
    price: "Rp259.000",
    period: "/month",
    description: "Perfect for small creator handlers.",
    features: [
      "1 User",
      "5 Campaigns / month",
      "20 Creators / month",
      "50 Tracked Contents / month",
      "Content Planner",
      "Creator CRM",
      "Campaign Tracking",
    ],
    cta: "Get Started",
    ctaHref: "#access",
    buttonVariant: "secondary",
  },
  {
    name: "Growth",
    badge: "Most Popular",
    badgeStyle: "popular",
    originalPrice: "Rp1.099.000",
    price: "Rp799.000",
    period: "/month",
    description: "For growing teams.",
    features: [
      "3 Users",
      "15 Campaigns / month",
      "50 Creators / month",
      "150 Tracked Contents / month",
      "Content Planner",
      "Creator CRM",
      "Campaign Tracking",
      "Performance Dashboard",
      "Campaign Comparison",
      "Monthly Performance Comparison",
    ],
    cta: "Start Growing",
    ctaHref: "#access",
    buttonVariant: "gradient",
    highlighted: true,
  },
  {
    name: "Scale",
    originalPrice: "Rp2.499.000",
    price: "Rp1.890.000",
    period: "/month",
    description: "For bigger brands & agencies.",
    features: [
      "5 Users",
      "50 Campaigns / month",
      "150 Creators / month",
      "500 Tracked Contents / month",
      "Content Planner",
      "Creator CRM",
      "Campaign Tracking",
      "Performance Dashboard",
      "Payout Reminder & Tracking",
      "Team Workspace",
      "Advanced Reporting",
    ],
    cta: "Scale Your Operations",
    ctaHref: "#access",
    buttonVariant: "dark",
  },
];

type AddOn = {
  icon: LucideIcon;
  title: string;
  price: string;
  description: string;
  badge?: string;
};

const addOns: AddOn[] = [
  {
    icon: Users,
    title: "Additional User",
    price: "Rp50.000",
    description: "Add an extra team member to your workspace.",
  },
  {
    icon: Folder,
    title: "Additional Campaigns",
    price: "Rp99.000",
    description: "Add 5 additional campaigns.",
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
    badge: "Popular Add-on",
  },
  {
    icon: Wallet,
    title: "Payout Tracking",
    price: "Rp199.000",
    description: "Manage creator payments and payout reminders.",
  },
];

function PlanBadge({
  label,
  style = "default",
}: {
  label: string;
  style?: "default" | "free" | "popular";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
        style === "popular" &&
          "bg-gradient-to-r from-[#3B82F6] to-[#A855F7] text-white shadow-[0_4px_20px_-4px_rgba(168,85,247,0.6)]",
        style === "free" &&
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
        style === "default" &&
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
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={className}>
      <Link
        href={href}
        className={cn(
          "flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
          variant === "outline" &&
            "border border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/[0.04]",
          variant === "secondary" &&
            "border border-white/[0.08] bg-white/[0.05] text-white hover:border-white/15 hover:bg-white/[0.08]",
          variant === "gradient" &&
            "bg-gradient-to-r from-[#3B82F6] to-[#A855F7] text-white shadow-[0_8px_32px_-8px_rgba(99,102,241,0.55)] hover:shadow-[0_12px_40px_-8px_rgba(129,140,248,0.65)]",
          variant === "dark" &&
            "border border-white/[0.1] bg-[#0a1020] text-white hover:border-white/20 hover:bg-[#0d1428]",
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const isHighlighted = plan.highlighted;

  return (
    <FadeIn delay={index * 0.08} className={cn(isHighlighted && "lg:z-10")}>
      <motion.div
        whileHover={
          isHighlighted
            ? { y: -6, scale: 1.02, transition: { duration: 0.25 } }
            : { y: -4, transition: { duration: 0.25 } }
        }
        className={cn(
          "relative flex h-full flex-col rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-shadow duration-300",
          isHighlighted
            ? "shadow-[0_0_80px_-12px_rgba(168,85,247,0.55)] hover:shadow-[0_0_100px_-8px_rgba(168,85,247,0.65)] lg:min-h-[620px] lg:py-8"
            : "shadow-[0_0_60px_-20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_80px_-16px_rgba(168,85,247,0.35)] lg:min-h-[580px]",
        )}
      >
        {isHighlighted ? (
          <div className="pointer-events-none absolute -inset-px rounded-[24px] bg-gradient-to-b from-violet-500/20 via-transparent to-blue-500/10" />
        ) : null}

        <div className="relative flex flex-1 flex-col">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            {plan.badge ? (
              <PlanBadge label={plan.badge} style={plan.badgeStyle} />
            ) : null}
          </div>

          <div className="mb-1">
            {plan.originalPrice ? (
              <p className="text-sm text-slate-500 line-through">{plan.originalPrice}</p>
            ) : null}
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "font-bold tracking-tight text-white",
                  plan.price === "Free" ? "text-4xl" : "text-3xl",
                )}
              >
                {plan.price}
              </span>
              {plan.period ? (
                <span className="text-sm text-slate-500">{plan.period}</span>
              ) : null}
            </div>
            {plan.subtitle ? (
              <p className="mt-1 text-xs text-slate-500">{plan.subtitle}</p>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-slate-400">{plan.description}</p>

          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    isHighlighted ? "text-violet-400" : "text-blue-400/80",
                  )}
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
    <FadeIn delay={index * 0.06}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className="group relative flex h-full flex-col rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl shadow-[0_0_60px_-20px_rgba(168,85,247,0.2)] transition-shadow duration-300 hover:shadow-[0_0_80px_-16px_rgba(168,85,247,0.4)]"
      >
        {addOn.badge ? (
          <span className="absolute right-4 top-4 inline-flex rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_16px_-4px_rgba(168,85,247,0.5)]">
            {addOn.badge}
          </span>
        ) : null}

        <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/15 p-3 ring-1 ring-white/[0.06] transition-colors group-hover:from-blue-500/25 group-hover:to-violet-500/20">
          <Icon className="h-5 w-5 text-violet-300" />
        </div>

        <h3 className="text-base font-semibold text-white">{addOn.title}</h3>

        <div className="mt-3 flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-white">{addOn.price}</span>
          <span className="text-sm text-slate-500">/month</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">{addOn.description}</p>
      </motion.div>
    </FadeIn>
  );
}

function AddOnsSection() {
  return (
    <div className="mt-24">
      <FadeIn>
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            ⚡ Flexible Add-ons
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Scale as your team grows
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-400">
            Expand your workspace without upgrading your entire plan.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {addOns.map((addOn, index) => (
          <AddOnCard key={addOn.title} addOn={addOn} index={index} />
        ))}
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.12), transparent), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(59,130,246,0.08), transparent)",
        }}
      />

      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              💎 Simple Pricing
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built to <GradientText>scale creator campaigns</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              Everything you need to manage creators, track campaign performance, and
              organize content operations.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:items-center">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        <AddOnsSection />

        <FadeIn delay={0.35}>
          <div className="mx-auto mt-16 max-w-xl text-center">
            <h3 className="text-xl font-semibold text-white">Need something custom?</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              For enterprise teams requiring custom workflows, API access, white-label
              reports, or dedicated support.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-block"
            >
              <Link
                href="mailto:hello@kefoo.io?subject=Enterprise%20Sales%20Inquiry"
                className="inline-flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07]"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
