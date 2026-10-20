import type { Metadata } from "next";
import { WeddingLanding } from "@/components/wedding/landing";

const homeTitle = "Kefoo Wedding Planner — Rencanakan Pernikahan dengan Tenang";
const homeDescription =
  "Atur anggaran, kelola pengeluaran, pantau pembayaran vendor, dan susun persiapan pernikahan dalam satu tempat.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    locale: "id_ID",
    type: "website",
  },
};

export default function HomePage() {
  return <WeddingLanding />;
}
