import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Debt Tracker",
    template: "%s | Debt Tracker",
  },
  description: "Private personal debt ledger.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DebtRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wedding-app min-h-screen bg-[#f7f3ea] text-ink">
      {children}
    </div>
  );
}
