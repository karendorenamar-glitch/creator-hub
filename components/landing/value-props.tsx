"use client";

import {
  BarChart3,
  Calendar,
  GitCompare,
  Shield,
  Wallet,
} from "lucide-react";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  SectionHeading,
} from "@/components/landing/landing-shared";

const valueProps = [
  {
    icon: BarChart3,
    title: "Link in, insights out",
    description: "Paste a URL — metrics and creator info appear automatically",
  },
  {
    icon: Calendar,
    title: "Plan ahead",
    description: "Organize content pillars and never miss a publish date",
  },
  {
    icon: GitCompare,
    title: "Compare & decide",
    description: "Spot top performers across views, ER, and CPV",
  },
  {
    icon: Wallet,
    title: "Payouts on track",
    description: "Due dates and status, calculated for you",
  },
  {
    icon: Shield,
    title: "Built to trust",
    description: "Your campaign data stays secure and always current",
  },
];

export function ValueProps() {
  return (
    <section id="resources" className="border-y border-slate-200/70 bg-white/80 py-28">
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <SectionHeading title="Built for teams who run KOL Campaigns at scale" />
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {valueProps.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.06}>
              <GlassCard className="h-full p-5 text-center">
                <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-kefoo-500/15 to-kefoo-500/15 p-3">
                  <item.icon className="h-5 w-5 text-kefoo-300" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}