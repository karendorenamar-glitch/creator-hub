import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ogImage = {
  url: "/og-image.jpg",
  width: 831,
  height: 831,
  alt: "Kefoo — KOL Campaign Management Platform",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kefoo.tech"),

  title: {
    default: "Kefoo | KOL Campaign Management Platform",
    template: "%s | Kefoo",
  },

  description:
    "Manage creators, track TikTok performance, monitor campaign analytics, and automate influencer reporting in one click.",

  keywords: [
    "Creator CRM",
    "Creator Campaign Management",
    "Influencer Campaign Management",
    "KOL Management",
    "Creator Analytics",
    "TikTok Analytics",
    "Campaign Tracker",
    "Influencer Reporting",
  ],

  openGraph: {
    title: "Kefoo",
    description:
      "Track KOL campaign, manage campaigns, and automate reporting.",
    url: "https://kefoo.tech",
    siteName: "Kefoo",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kefoo",
    description:
      "Track KOL campaign and manage influencer campaigns effortlessly.",
    images: [ogImage.url],
  },

  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
