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
    title: "Instant Intelligence",
    description: "Paste link, get insights automatically",
  },
  {
    icon: Calendar,
    title: "Plan Smarter",
    description: "Organize content and never miss a post",
  },
  {
    icon: GitCompare,
    title: "Compare & Optimize",
    description: "Find what works, scale what performs",
  },
  {
    icon: Wallet,
    title: "Payouts Made Easy",
    description: "Automate payments and track everything",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data is safe and always up to date",
  },
];

export function ValueProps() {
  return (
    <section id="resources" className="border-y border-white/[0.06] bg-white/[0.01] py-28">
      <div className={CONTAINER_CLASS}>
        <FadeIn>
          <SectionHeading title="Built for KOL specialists who demand clarity and results" />
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {valueProps.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.06}>
              <GlassCard className="h-full p-5 text-center">
                <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 p-3">
                  <item.icon className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
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
