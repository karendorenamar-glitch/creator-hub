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
  "Kefoo Wedding Planner — atur anggaran, vendor, tamu, checklist, dan inspirasi pernikahan dalam satu tempat.";

const ogImage = {
  url: "/og-image.jpg",
  width: 831,
  height: 831,
  alt: "Kefoo Wedding Planner",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kefoo.tech"),

  title: {
    default: "Kefoo Wedding Planner",
    template: "%s | Kefoo",
  },

  description: siteDescription,

  keywords: [
    "wedding planner",
    "anggaran pernikahan",
    "daftar tamu pernikahan",
    "manajemen vendor pernikahan",
    "checklist pernikahan",
  ],

  openGraph: {
    title: "Kefoo Wedding Planner",
    description: siteDescription,
    url: "https://kefoo.tech",
    siteName: "Kefoo",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kefoo Wedding Planner",
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
