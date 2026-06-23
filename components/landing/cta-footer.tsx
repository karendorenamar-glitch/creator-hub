"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KeffooBrandLockup } from "@/components/login/kefoo-logo";
import {
  CONTAINER_CLASS,
  FadeIn,
  GlassCard,
  GradientButton,
  SCHEDULE_DEMO_MAILTO,
} from "@/components/landing/landing-shared";

export function CTAFooter() {
  return (
    <>
      <section id="access" className="py-28">
        <div className={CONTAINER_CLASS}>
          <FadeIn>
            <GlassCard
              glow
              hover={false}
              className="relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kefoo-500/10 via-transparent to-kefoo-500/15" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  Built for the People Behind Every Campaign.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
                  For the late nights, endless spreadsheets and everything in between.
                </p>
                <div className="mt-10 flex justify-center">
                  <GradientButton href={SCHEDULE_DEMO_MAILTO} size="lg">
                    Schedule a Demo
                    <ArrowRight className="h-5 w-5" />
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 pb-10 pt-12">
        <div className={CONTAINER_CLASS}>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
            <KeffooBrandLockup size="md" />
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <Link href="#features" className="transition-colors hover:text-kefoo-600">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-kefoo-600">
                Pricing
              </Link>
              <Link href="/login" className="transition-colors hover:text-kefoo-600">
                Sign In
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <a
              href="mailto:hello@kefoo.tech"
              className="text-sm font-bold text-kefoo-600 transition-colors hover:text-kefoo-500"
            >
              hello@kefoo.tech
            </a>
            <p className="mt-2 text-xs text-slate-500">
              © {new Date().getFullYear()} Kefoo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
