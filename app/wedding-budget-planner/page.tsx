import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ReceiptText,
  Wallet,
} from "lucide-react";
import {
  ArticleCta,
  PublicSeoShell,
} from "@/components/wedding/public-seo-shell";
import {
  KEFOO_OG_IMAGE,
  KEFOO_SITE_URL,
} from "@/lib/wedding/seo";

const PATH = "/wedding-budget-planner";
const TITLE = "Wedding Budget Planner untuk Mengatur Anggaran | Kefoo";
const DESCRIPTION =
  "Atur budget pernikahan, catat pengeluaran, dan pantau pembayaran vendor dalam satu tempat dengan Kefoo. Rencanakan pernikahan lebih terorganisir.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${KEFOO_SITE_URL}${PATH}`,
    siteName: "Kefoo",
    locale: "id_ID",
    type: "website",
    images: [KEFOO_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [KEFOO_OG_IMAGE.url],
  },
};

const FAQS = [
  {
    question: "Apakah Kefoo bisa mencatat pembayaran vendor?",
    answer:
      "Ya. Setiap pembayaran vendor dicatat sebagai transaksi dengan tanggal, nominal, jenis pembayaran, catatan, dan bukti bila tersedia. Total yang sudah dibayar dan sisa tagihan dihitung dari transaksi tersebut.",
  },
  {
    question: "Apakah budget bisa diubah setelah vendor ditambahkan?",
    answer:
      "Bisa. Kamu dapat memperbarui target anggaran, harga vendor, dan biaya lainnya. Perubahan akan memengaruhi ringkasan budget, jadi selalu periksa selisih dan sisa tagihan setelahnya.",
  },
  {
    question: "Apakah biaya lainnya bisa dicatat tanpa vendor?",
    answer:
      "Ya. Biaya seperti transportasi, administrasi, atau kebutuhan tambahan dapat dicatat sebagai biaya lainnya dengan status pembayaran sendiri.",
  },
  {
    question: "Apakah donasi bisa dicatat?",
    answer:
      "Ya. Donasi dapat dicatat per donatur dan dialokasikan ke kebutuhan anggaran. Alokasi donasi tidak dihitung sebagai pembayaran tunai vendor.",
  },
];

function BudgetPreview() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-champagne/60 bg-white shadow-[0_35px_80px_-60px_rgba(87,66,63,0.65)]">
      <div className="flex items-center justify-between border-b border-blush/60 bg-blush/20 px-5 py-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-cocoa/45">
          Pratinjau tampilan Budget Kefoo
        </p>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] text-cocoa/50">
          Ilustrasi
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:p-7">
        <div className="rounded-2xl bg-[#FBF7F2] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-cocoa/45">
            Sisa yang perlu disiapkan
          </p>
          <p className="mt-2 font-heading text-3xl text-cocoa">
            Rp 72.500.000
          </p>
          <div className="mt-4 flex justify-between text-[11px] text-cocoa/55">
            <span>Progres pembayaran</span>
            <span>49%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EAE0D7]">
            <div className="h-full w-[49%] rounded-full bg-sage" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-cocoa/45">
            <span>Dibayar Rp 67.500.000</span>
            <span>Total biaya Rp 140.000.000</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Venue & catering", "Rp 75.000.000", "Terbayar sebagian"],
            ["Dekorasi", "Rp 25.000.000", "Lunas"],
            ["Dokumentasi", "Rp 20.000.000", "Belum bayar"],
            ["Biaya lainnya", "Rp 20.000.000", "Terbayar sebagian"],
          ].map(([name, amount, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-xl border border-blush/60 px-3 py-2.5"
            >
              <div>
                <p className="text-xs font-medium text-cocoa">{name}</p>
                <p className="mt-0.5 text-[10px] text-cocoa/45">{amount}</p>
              </div>
              <span className="rounded-full bg-sage/25 px-2 py-0.5 text-[9px] text-cocoa/65">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WeddingBudgetPlannerPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <PublicSeoShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-16">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-rosewood">
            <Wallet className="size-3.5" aria-hidden />
            Panduan budget pernikahan
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-[1.08] text-cocoa sm:text-5xl">
            Wedding Budget Planner untuk Anggaran Pernikahan yang Lebih
            Terkontrol.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cocoa/70">
            Budget pernikahan bukan sekadar total pengeluaran. Kamu perlu tahu
            berapa yang direncanakan, apa yang sudah dibayar, dan berapa yang
            masih harus disiapkan. Kefoo menyatukan pencatatan itu dalam satu
            tempat.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/wedding/signup"
              className="inline-flex items-center gap-2 rounded-full bg-rosewood px-5 py-3 text-sm font-medium text-ivory hover:bg-cocoa"
            >
              Mulai atur budget
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#contoh"
              className="inline-flex items-center gap-2 rounded-full border border-champagne/70 px-5 py-3 text-sm font-medium text-cocoa hover:bg-blush/30"
            >
              Lihat contoh pembagian
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <BudgetPreview />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
              Masalah yang diselesaikan
            </p>
            <h2 className="mt-3 font-heading text-3xl leading-tight text-cocoa">
              Banyak angka, satu sumber yang bisa dipercaya.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cocoa/70">
              Tanpa pencatatan yang konsisten, harga vendor, DP, biaya
              transportasi, dan donasi bisa terlihat seperti angka yang saling
              bertentangan. Kefoo memisahkan total biaya, pembayaran tunai, dan
              alokasi donasi agar keputusan berikutnya lebih jelas.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-cocoa/70">
              {[
                "Target anggaran sebagai batas perencanaan.",
                "Harga vendor dan biaya lain dalam satu ringkasan.",
                "Pembayaran tercatat dengan riwayat dan bukti.",
                "Sisa tagihan dan progres pembayaran yang dihitung otomatis.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-sage"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-16 border-t border-blush/60 pt-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
            Fitur budgeting
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl text-cocoa">
            Dirancang untuk pertanyaan yang benar-benar muncul saat menyusun
            anggaran.
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: CircleDollarSign,
                title: "Rencana dan realisasi",
                body: "Bandingkan target anggaran dengan total biaya vendor dan biaya lainnya.",
              },
              {
                icon: ReceiptText,
                title: "Riwayat pembayaran",
                body: "Catat DP, termin, dan pelunasan sebagai transaksi yang bisa ditinjau kembali.",
              },
              {
                icon: CheckCircle2,
                title: "Sisa yang jelas",
                body: "Lihat pembayaran tercatat, sisa tagihan, dan progres tanpa menebak.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-blush/60 bg-white/75 p-5"
              >
                <Icon className="size-5 text-sage" aria-hidden />
                <h3 className="mt-3 font-heading text-xl text-cocoa">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="contoh" className="mt-16 border-t border-blush/60 pt-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
            Contoh ilustratif
          </p>
          <h2 className="mt-3 font-heading text-3xl text-cocoa">
            Cara membagi budget pernikahan.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cocoa/65">
            Angka berikut hanya ilustrasi untuk total rencana Rp150.000.000,
            bukan standar harga atau jaminan hasil. Sesuaikan dengan prioritas,
            kota, jumlah tamu, dan vendor yang benar-benar kamu pilih.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-blush/60 bg-white/80">
            {[
              ["Venue dan catering", "Rp75.000.000", "50%"],
              ["Dekorasi dan dokumentasi", "Rp30.000.000", "20%"],
              ["Busana, rias, dan undangan", "Rp20.000.000", "13,3%"],
              ["Transportasi dan administrasi", "Rp10.000.000", "6,7%"],
              ["Buffer", "Rp15.000.000", "10%"],
            ].map(([name, amount, percent]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 border-b border-blush/40 px-4 py-3.5 last:border-b-0 sm:px-5"
              >
                <span className="text-sm text-cocoa">{name}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="text-cocoa/45">{percent}</span>
                  <span className="font-medium text-cocoa">{amount}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-blush/60 pt-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
            Baca lebih lanjut
          </p>
          <h2 className="mt-3 font-heading text-3xl text-cocoa">
            Panduan untuk langkah berikutnya.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [
                "/wedding-budget-planner/cara-membuat-budget-pernikahan",
                "Cara membuat budget pernikahan dari nol",
              ],
              [
                "/wedding-budget-planner/rincian-biaya-pernikahan",
                "Rincian biaya pernikahan dan cara membaginya",
              ],
              [
                "/wedding-budget-planner/mengontrol-pengeluaran-vendor",
                "Mengontrol pengeluaran dan pembayaran vendor",
              ],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-blush/60 bg-white/75 p-4 text-sm font-medium text-cocoa hover:border-rosewood/40 hover:text-rosewood"
              >
                {label}
                <ArrowRight
                  className="mt-3 size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-16 border-t border-blush/60 pt-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rosewood">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-3xl text-cocoa">
            Pertanyaan tentang budget pernikahan.
          </h2>
          <div className="mt-6 max-w-3xl divide-y divide-blush/60 border-y border-blush/60">
            {FAQS.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer list-none pr-6 font-medium text-cocoa marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-14">
          <ArticleCta />
        </div>
      </article>
    </PublicSeoShell>
  );
}
