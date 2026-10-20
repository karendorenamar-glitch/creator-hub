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

const STATS = [
  { label: "Total biaya", value: "Rp 150.000.000" },
  { label: "Sudah dibayar", value: "Rp 45.000.000" },
  { label: "Sisa biaya", value: "Rp 105.000.000" },
];

export function WeddingLanding() {
  return (
    <div className="wedding-app min-h-screen bg-cream text-ink">
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
              className="rounded-xl bg-olive-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-olive-700"
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
              <span className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-white/70 px-3 py-1 text-xs text-olive-700">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-olive-700"
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
              <div className="absolute -left-6 -top-6 hidden size-24 rounded-full bg-olive-100/70 blur-2xl sm:block" />
              <div className="relative rounded-3xl border border-olive-100 bg-white p-6 shadow-[0_30px_80px_-60px_rgba(74,90,57,0.6)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-olive-600">
                      Ringkasan persiapan
                    </p>
                    <p className="mt-1 font-heading text-lg">
                      Dorena &amp; Vandy
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-olive-50 px-2.5 py-1 text-[11px] text-olive-700">
                    Contoh tampilan
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl bg-olive-50/70 px-3 py-3"
                    >
                      <p className="text-[11px] uppercase tracking-[0.1em] text-ink-soft">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-soft">
                    <span>Anggaran terpakai</span>
                    <span>30%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-olive-100">
                    <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-olive-400 to-olive-600" />
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-olive-100 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Catering — DP</span>
                    <span className="font-medium">Rp 25.000.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dekorasi — lunas</span>
                    <span className="font-medium">Rp 20.000.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fotografi — diskusi</span>
                    <span className="text-ink-soft">—</span>
                  </div>
                </div>
              </div>
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

            <div className="flex items-end justify-center gap-4">
              <div className="w-full max-w-md rounded-2xl border border-olive-200 bg-white p-2 shadow-[0_24px_60px_-50px_rgba(74,90,57,0.8)]">
                <div className="rounded-xl bg-olive-50/70 p-4">
                  <div className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-olive-300" />
                    <span className="size-2 rounded-full bg-olive-200" />
                    <span className="size-2 rounded-full bg-olive-100" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-24 rounded bg-olive-200" />
                    <div className="h-16 rounded-lg bg-white" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 rounded-lg bg-white" />
                      <div className="h-10 rounded-lg bg-white" />
                      <div className="h-10 rounded-lg bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-24 shrink-0 rounded-2xl border border-olive-200 bg-white p-1.5 shadow-[0_18px_40px_-30px_rgba(74,90,57,0.9)] sm:w-28">
                <div className="space-y-2 rounded-xl bg-olive-50/70 p-2">
                  <div className="mx-auto h-1 w-8 rounded bg-olive-200" />
                  <div className="h-10 rounded-md bg-white" />
                  <div className="h-2 w-3/4 rounded bg-olive-200" />
                  <div className="h-2 w-1/2 rounded bg-olive-100" />
                </div>
              </div>
            </div>
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
                  className="rounded-3xl border border-olive-100 bg-cream p-6"
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
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-olive-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-olive-700"
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
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-olive-700 transition-colors hover:bg-olive-50"
            >
              Mulai Merencanakan
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-olive-100 bg-cream px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-ink-soft sm:flex-row">
          <BrandLogo />
          <p>© {new Date().getFullYear()} Kefoo Wedding Planner</p>
        </div>
      </footer>
    </div>
  );
}
