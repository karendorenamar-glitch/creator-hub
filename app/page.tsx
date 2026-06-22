import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Kefoo — Creator Intelligence OS",
  description:
    "Drop a link. Track and scale creator performance instantly. Built for KOL specialists, agencies, and brand teams.",
};

export default function HomePage() {
  return <LandingPage />;
}
