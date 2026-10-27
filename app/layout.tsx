import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import {
  KEFOO_DESCRIPTION,
  KEFOO_KEYWORDS,
  KEFOO_OG_IMAGE,
  KEFOO_SITE_URL,
  KEFOO_TITLE,
} from "@/lib/wedding/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription = KEFOO_DESCRIPTION;

const ogImage = KEFOO_OG_IMAGE;

export const metadata: Metadata = {
  metadataBase: new URL(KEFOO_SITE_URL),

  title: {
    default: KEFOO_TITLE,
    template: "%s | Kefoo",
  },

  description: siteDescription,
  keywords: KEFOO_KEYWORDS,

  openGraph: {
    title: KEFOO_TITLE,
    description: siteDescription,
    url: KEFOO_SITE_URL,
    siteName: "Kefoo",
    locale: "id_ID",
    type: "website",
    images: [ogImage],
  },

  twitter: {
    card: "summary_large_image",
    title: KEFOO_TITLE,
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
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
