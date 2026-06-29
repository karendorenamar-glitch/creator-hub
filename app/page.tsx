import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

const homeTitle = "Kefoo | Self-Serve KOL Campaign Tracker & Creator Analytics";
const homeDescription =
  "Run KOL campaigns yourself with live data. Create a workspace, paste video links, and track creator performance — free trial, no sales call required.";

export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "https://kefoo.tech",
  },
  twitter: {
    title: homeTitle,
    description: homeDescription,
  },
};

export default function HomePage() {
  return <LandingPage />;
}
