"use client";

import { Inter } from "next/font/google";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Payouts } from "@/components/landing/payouts";
import { CTAFooter } from "@/components/landing/cta-footer";
import { LandingBackground } from "@/components/landing/landing-shared";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export function LandingPage() {
  return (
    <div
      className={`${inter.className} min-h-screen bg-[#fdfaff] text-slate-700 antialiased`}
    >
      <LandingBackground />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Payouts />
        <Pricing />
        <CTAFooter />
      </main>
    </div>
  );
}