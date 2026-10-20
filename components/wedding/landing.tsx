import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Laptop,
  ListOrdered,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/wedding/brand-logo";
import { BudgetPlayground } from "@/components/wedding/budget-playground";
import { GoalConfetti } from "@/components/wedding/goal-confetti";

const FEATURES = [
  {
    icon: Wallet,
    title: "Anggaran yang jelas",
    body: "Tetapkan total biaya, bagi per kategori, dan lihat sisa anggaran secara langsung tanpa menghitung ulang.",
  },
  {
    icon: CheckCircle2,
    title: "Pembayaran terpantau",
    body: "Catat setiap pembayaran ke vendor beserta buktinya, lalu ketahui sisa tagihan yang belum diselesaikan.",
  },
  {
    icon: Store,
    title: "Vendor tertata",
    body: "Simpan kontak, harga kesepakatan, dan status setiap vendor agar tidak ada yang terlewat.",
  },
  {
    icon: ListOrdered,
    title: "Persiapan lebih runtut",
    body: "Susun daftar tugas dan linimasa persiapan, lengkap dengan tenggat dan prioritas.",
  },
  {
    icon: Users,
    title: "Tamu dan RSVP",
    body: "Kelola daftar tamu, kelompokkan undangan, dan pantau konfirmasi kehadiran dalam satu tampilan.",
  },
];

export function WeddingLanding() {
  return (
    <div className="wedding-app wedding-surface min-h-screen text-ink">
      <header className="sticky top-0 z-30 border-b border-olive-100/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
            <a href="#fitur" className="transition-colors hover:text-ink">
              Fitur
            </a>
            <a href="#harga" className="transition-colors hover:text-ink">
              Harga
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/wedding/login"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
            >
              Masuk
            </Link>
            <Link
              href="/wedding/signup"
              className="rounded-full bg-olive-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-700"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-olive-50 via-cream to-cream px-5 pb-16 pt-14 sm:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-petal-200 bg-white/80 px-3 py-1 text-xs text-petal-500">
                <Sparkles className="size-3.5" aria-hidden />
                Wedding planner untuk pasangan Indonesia
              </span>

              <h1 className="mt-5 font-heading text-4xl leading-tight sm:text-5xl lg:text-[3.4rem]">
                Wujudkan Pernikahan Impian, Tanpa Khawatir Soal Anggaran.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
                Rencanakan hari istimewa Anda dengan lebih tenang. Atur anggaran,
                kelola pengeluaran, pantau pembayaran vendor, dan susun setiap
                persiapan pernikahan dalam satu tempat.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/wedding/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-olive-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-olive-700"
                >
                  Mulai Merencanakan
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                Praktis, mudah diakses, dan dirancang untuk menemani perjalanan
                menuju hari istimewa Anda.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -right-4 -top-6 hidden size-20 rounded-full bg-olive-100/80 blur-2xl sm:block" />
              <div className="absolute -left-6 bottom-10 hidden text-olive-300 sm:block landing-float">
                <svg width="74" height="96" viewBox="0 0 74 96" fill="none" aria-hidden>
                  <path d="M37 94V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M37 62C24 58 16 48 15 34c14 1 22 11 22 28Z" fill="currentColor" opacity="0.55" />
                  <path d="M37 48c13-4 21-14 22-28-14 1-22 11-22 28Z" fill="currentColor" opacity="0.4" />
                  <path d="M37 80c-9-3-14-9-15-18 9 1 15 8 15 18Z" fill="currentColor" opacity="0.35" />
                  <circle cx="37" cy="16" r="7" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <BudgetPlayground />
            </div>
          </div>
        </section>

        <section id="aplikasi" className="px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h2 className="font-heading text-3xl leading-tight sm:text-4xl">
                Rencanakan dari Mana Saja.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
                Akses wedding planner Anda melalui ponsel, tablet, maupun laptop.
                Tidak perlu mengunduh atau memasang aplikasi—cukup buka website
                melalui browser dan lanjutkan perencanaan kapan saja.
              </p>

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="size-4 text-olive-500" aria-hidden />
                  Nyaman di ponsel
                </span>
                <span className="inline-flex items-center gap-2">
                  <Laptop className="size-4 text-olive-500" aria-hidden />
                  Rapi di laptop
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-olive-500" aria-hidden />
                  Data tersimpan aman
                </span>
              </div>
            </div>

            <GoalConfetti />
          </div>
        </section>


        <section id="fitur" className="bg-white/70 px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl font-heading text-3xl leading-tight sm:text-4xl">
              Semua yang Anda butuhkan untuk merencanakan dengan tenang.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              Dirancang agar persiapan terasa lebih ringan—bukan menambah
              pekerjaan baru.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-olive-100 bg-cream p-6 transition-transform duration-300 hover:-translate-y-1 hover:border-olive-200"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-olive-100 text-olive-700">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="harga" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-olive-200 bg-gradient-to-b from-white to-olive-50/60 p-8 text-center sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-olive-600">
              Satu paket, tanpa tingkatan
            </p>
            <h2 className="mt-3 font-heading text-2xl sm:text-3xl">
              Wedding Planner Pro
            </h2>

            <p className="mt-5 font-heading text-5xl text-ink">
              Rp20.000
              <span className="ml-1 text-base font-normal text-ink-soft">
                /bulan
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Akses seluruh fitur yang tersedia dalam satu paket.
            </p>

            <ul className="mx-auto mt-6 grid max-w-sm gap-2 text-left text-sm text-ink-soft">
              {[
                "Anggaran dan pemantauan pembayaran",
                "Pengelolaan vendor",
                "Daftar tamu dan RSVP",
                "Tugas dan linimasa persiapan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-olive-600"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/wedding/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-olive-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-olive-700"
            >
              Mulai Merencanakan
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <p className="mt-4 text-xs text-ink-soft">
              Pembayaran online belum tersedia. Tim kami akan membantu proses
              aktivasi.
            </p>
          </div>
        </section>

        <section className="bg-olive-600 px-5 py-16 text-center text-white sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-3xl leading-tight sm:text-4xl">
              Persiapan Lebih Teratur, Menyambut Hari Istimewa dengan Tenang.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
              Mulai susun anggaran, atur setiap kebutuhan, dan nikmati perjalanan
              menuju pernikahan Anda dengan lebih terencana.
            </p>
            <Link
              href="/wedding/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50"
            >
              Mulai Merencanakan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-petal-100 bg-cream/80 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-ink-soft sm:flex-row sm:items-end sm:justify-between">
          <BrandLogo />
          <div className="text-center sm:text-right">
            <p>
              Email:{" "}
              <a
                href="mailto:hello@kefootech"
                className="font-medium text-olive-700 underline-offset-4 hover:underline"
              >
                hello@kefootech
              </a>
            </p>
            <p className="mt-1 text-xs text-ink-soft/80">
              © {new Date().getFullYear()} Kefoo Wedding Planner
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
