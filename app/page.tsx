import type { Metadata } from "next";
import { WeddingLanding } from "@/components/wedding/landing";
import {
  KEFOO_DESCRIPTION,
  KEFOO_KEYWORDS,
  KEFOO_OG_IMAGE,
  KEFOO_SITE_URL,
  KEFOO_TITLE,
} from "@/lib/wedding/seo";

export const metadata: Metadata = {
  title: { absolute: KEFOO_TITLE },
  description: KEFOO_DESCRIPTION,
  keywords: KEFOO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    title: KEFOO_TITLE,
    description: KEFOO_DESCRIPTION,
    url: KEFOO_SITE_URL,
    siteName: "Kefoo",
    locale: "id_ID",
    type: "website",
    images: [KEFOO_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: KEFOO_TITLE,
    description: KEFOO_DESCRIPTION,
    images: [KEFOO_OG_IMAGE.url],
  },
};

export default function HomePage() {
  return <WeddingLanding />;
}
