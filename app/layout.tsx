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

const siteDescription =
  "Self-serve KOL campaign tracker for brands and agencies. Search campaign videos by keyword, paste TikTok & Instagram links, track live creator performance, and manage payouts. Free trial, no demo required.";

const ogImage = {
  url: "/og-image.jpg",
  width: 831,
  height: 831,
  alt: "Kefoo — self-serve KOL campaign tracker with live creator analytics",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kefoo.tech"),

  title: {
    default: "Kefoo | Self-Serve KOL Campaign Tracker",
    template: "%s | Kefoo",
  },

  description: siteDescription,

  keywords: [
    "KOL campaign tracker",
    "influencer campaign management",
    "creator analytics",
    "TikTok campaign analytics",
    "Instagram creator tracking",
    "KOL management software",
    "influencer reporting",
    "campaign performance dashboard",
    "self-serve influencer marketing",
  ],

  openGraph: {
    title: "Kefoo | Self-Serve KOL Campaign Tracker",
    description: siteDescription,
    url: "https://kefoo.tech",
    siteName: "Kefoo",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kefoo | Self-Serve KOL Campaign Tracker",
    description: siteDescription,
    images: [ogImage.url],
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
