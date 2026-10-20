import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kefoo Wedding Planner",
    template: "%s | Kefoo Wedding Planner",
  },
  description:
    "Plan your wedding in one calm place: budget, guests and RSVPs, vendors and payments, checklist and inspiration.",
};

export default function WeddingRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="wedding-app min-h-screen bg-cream text-ink">{children}</div>;
}
