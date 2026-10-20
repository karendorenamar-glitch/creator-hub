"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ListChecks,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/wedding/brand-logo";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-rosewood">
      <span className="h-px w-8 bg-champagne" aria-hidden />
      {children}
    </p>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`landing-fade ${className ?? ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function FloralCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M60 138V46"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M60 96C38 90 24 74 22 50c24 2 38 18 38 46Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.55"
      />
      <path
        d="M60 74c22-6 36-22 38-46-24 2-38 18-38 46Z"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
      />
      <circle cx="60" cy="30" r="12" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="30" r="4" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: CircleDollarSign,
    label: "01 — Anggaran",
    title: "Anggaran yang tersusun, bukan sekadar catatan.",
    body: "Tetapkan total biaya, bagi per kategori, lalu lihat sisa dana setiap kali ada pengeluaran baru. Semua angka diperbarui otomatis.",
  },
  {
    icon: Store,
    label: "02 — Vendor",
    title: "Satu tempat untuk semua vendor Anda.",
    body: "Simpan kontak, harga kesepakatan, dan status pembayaran—DP, cicilan, hingga lunas—beserta bukti pembayarannya.",
  },
  {
    icon: ListChecks,
    label: "03 — Persiapan",
    title: "Persiapan yang terasa lebih ringan.",
    body: "Susun tugas dan linimasa per tahap, atur tenggat dan prioritas, lalu pantau apa yang sudah selesai.",
  },
  {
    icon: Users,
    label: "04 — Tamu",
    title: "Kenali tamu Anda dengan lebih dekat.",
    body: "Kelola daftar tamu, kelompokkan, dan pantau konfirmasi kehadiran agar jumlah undangan tetap terkendali.",
  },
];

export function WeddingLanding() {
  return (
    <div className="wedding-app wedding-surface min-h-screen text-cocoa">
      <header className="sticky top-0 z-40 border-b border-blush/60 bg-ivory/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-cocoa/70 md:flex">
            {[
              ["Fitur", "#fitur"],
              ["Anggaran", "#anggaran"],
              ["Harga", "#harga"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="group relative py-1 transition-colors hover:text-rosewood"
              >
                {label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px scale-x-0 bg-champagne transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/wedding/login"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-cocoa/70 transition-colors hover:bg-blush/50 hover:text-cocoa"
            >
              Masuk
            </Link>
            <Link
              href="/wedding/signup"
              className="rounded-full bg-rosewood px-4 py-2 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:pt-20">
          <div className="pointer-events-none absolute -left-10 top-24 hidden text-champagne/60 sm:block">
            <FloralCorner className="landing-float size-28" />
          </div>
          <div className="pointer-events-none absolute -right-6 top-6 hidden rotate-180 text-dusty/50 sm:block">
            <FloralCorner className="landing-float size-24" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="landing-fade">
                <Eyebrow>Untuk perjalanan menuju hari istimewa</Eyebrow>
              </div>

              <h1
                className="landing-fade mt-6 font-heading text-[2.6rem] leading-[1.08] tracking-tight text-cocoa sm:text-6xl lg:text-[4.1rem]"
              >
                Merencanakan Hari Istimewa,
                <br className="hidden sm:block" />{" "}
                <span className="italic text-rosewood">
                  dengan Hati yang Lebih Tenang.
                </span>
              </h1>

              <p
                className="landing-fade mt-6 max-w-xl text-base leading-relaxed text-cocoa/70 sm:text-lg"
              >
                Setiap detail memiliki cerita. Atur anggaran, kelola kebutuhan,
                dan persiapkan pernikahan impian Anda dalam satu ruang yang
                dirancang dengan indah.
              </p>

              <div
                className="landing-fade mt-9 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/wedding/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-rosewood px-7 py-3.5 text-sm font-medium text-ivory shadow-[0_18px_40px_-24px_rgba(168,111,122,0.9)] transition-all hover:-translate-y-0.5 hover:bg-cocoa"
                >
                  Mulai Merencanakan
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
                <a
                  href="#fitur"
                  className="inline-flex items-center gap-2 rounded-full border border-champagne/60 px-6 py-3.5 text-sm font-medium text-cocoa transition-colors hover:bg-blush/40"
                >
                  Jelajahi Fitur
                </a>
              </div>

              <p className="landing-fade mt-5 text-sm text-cocoa/55">
                Satu ruang untuk anggaran, vendor, tamu, dan seluruh persiapan.
              </p>
            </div>

            <div className="landing-fade relative mx-auto w-full max-w-md">
              <div className="absolute -left-8 -top-10 size-28 rounded-full bg-blush/70 blur-2xl" />
              <div className="relative overflow-hidden rounded-t-[10rem] rounded-b-[2rem] border border-champagne/50 bg-gradient-to-b from-sage/70 via-blush/60 to-ivory p-3 shadow-[0_45px_90px_-65px_rgba(87,66,63,0.55)]">
                <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-t-[9rem] rounded-b-[1.6rem] bg-gradient-to-b from-dusty/45 via-blush/70 to-ivory">
                  <FloralCorner className="size-44 text-rosewood/35" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-5xl italic text-ivory/70">
                    H &amp; J
                  </span>
                  <p className="absolute bottom-6 font-heading text-sm italic text-cocoa/60">
                    Hailey &amp; Justin · 2027
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-6 w-56 rounded-2xl border border-blush bg-ivory/95 p-4 shadow-[0_25px_50px_-35px_rgba(87,66,63,0.6)] backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.22em] text-rosewood">
                  Anggaran
                </p>
                <p className="mt-1 font-heading text-2xl text-cocoa">Rp 150 jt</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blush">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-dusty to-rosewood"
                    style={{ width: "78%" }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-cocoa/60">
                  78% terpakai · sisa Rp 33 jt
                </p>
              </div>

              <Sparkles
                className="absolute -right-2 top-10 hidden size-6 text-champagne sm:block landing-float"
                aria-hidden
              />
            </div>

          </div>
        </section>

        <section id="fitur" className="border-y border-blush/60 bg-ivory/70 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Eyebrow>Setiap detail, lebih terencana</Eyebrow>
              <h2 className="mt-5 max-w-3xl font-heading text-4xl leading-[1.12] text-cocoa sm:text-5xl">
                Dari anggaran pertama hingga{" "}
                <span className="italic text-rosewood">
                  daftar persiapan terakhir.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cocoa/70">
                Semua kebutuhan tersusun rapi agar Anda bisa lebih menikmati
                prosesnya.
              </p>
            </Reveal>

            <div className="mt-14 space-y-10">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.05}>
                  <div
                    className={`grid items-center gap-6 border-t border-champagne/30 pt-8 md:grid-cols-[0.9fr_1.1fr] ${
                      index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-champagne">
                        {feature.label}
                      </p>
                      <h3 className="mt-3 max-w-md font-heading text-2xl leading-snug text-cocoa sm:text-3xl">
                        {feature.title}
                      </h3>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-champagne/50 bg-ivory text-rosewood">
                        <feature.icon className="size-5" aria-hidden />
                      </span>
                      <p className="text-sm leading-relaxed text-cocoa/70 sm:text-base">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="anggaran" className="relative overflow-hidden px-5 py-20">
          <div className="pointer-events-none absolute right-0 top-16 hidden text-sage md:block">
            <FloralCorner className="size-40 rotate-180" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <Eyebrow>Anggaran</Eyebrow>
              <h2 className="mt-5 font-heading text-4xl leading-[1.12] text-cocoa sm:text-[2.9rem]">
                Tahu persis ke mana{" "}
                <span className="italic text-rosewood">setiap rupiah</span>{" "}
                berjalan.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-cocoa/70">
                Bedakan anggaran yang sudah dialokasikan dengan uang yang benar-
                benar sudah dibayarkan. Sisa dana selalu terlihat, tanpa perlu
                menghitung ulang.
              </p>
              <Link
                href="/wedding/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa"
              >
                Mulai Merencanakan
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-[1.8rem] border border-blush bg-ivory/95 p-6 shadow-[0_35px_80px_-60px_rgba(87,66,63,0.5)] sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-rosewood">
                    Contoh tampilan anggaran
                  </p>
                  <span className="rounded-full bg-sage/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-cocoa/70">
                    Data contoh
                  </span>
                </div>

                <p className="mt-4 font-heading text-3xl text-cocoa sm:text-4xl">
                  Rp 150.000.000
                </p>
                <p className="text-xs text-cocoa/55">Total biaya pernikahan</p>

                <div className="mt-7 space-y-5">
                  {[
                    { label: "Sudah dialokasikan", value: "Rp 92.000.000", pct: "61%" },
                    { label: "Sudah dibayarkan", value: "Rp 45.000.000", pct: "30%" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-cocoa/70">{row.label}</span>
                        <span className="font-medium text-cocoa">{row.value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush/70">
                        
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-champagne/30 pt-4">
                    <span className="text-sm text-cocoa/70">Sisa biaya</span>
                    <span className="font-heading text-2xl text-rosewood">
                      Rp 58.000.000
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-cocoa/50">
                  Angka di atas hanya contoh. Di dalam aplikasi, semua nilai
                  dihitung otomatis dari anggaran dan pembayaran Anda.
                </p>
              </div>
            </Reveal>

          </div>
        </section>

        <section id="harga" className="border-y border-blush/60 bg-blush/45 px-5 py-20">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <p className="text-[11px] uppercase tracking-[0.32em] text-rosewood">
                Harga
              </p>
              <h2 className="mx-auto mt-5 max-w-2xl font-heading text-4xl leading-[1.12] text-cocoa sm:text-[2.9rem]">
                Perencanaan indah, dengan harga yang{" "}
                <span className="italic text-rosewood">tetap bersahabat.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-cocoa/70">
                Satu harga untuk mengakses seluruh fitur yang tersedia.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-12">
              <div className="relative overflow-hidden rounded-[2rem] border border-champagne/60 bg-ivory p-8 text-center shadow-[0_40px_90px_-70px_rgba(87,66,63,0.6)] sm:p-12">
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-blush/60 blur-2xl" />

                <p className="relative font-heading text-[10px] uppercase tracking-[0.3em] text-rosewood">
                  Wedding Planner Pro
                </p>
                <p className="relative mt-4 font-heading text-6xl leading-none text-cocoa">
                  Rp20.000
                  <span className="ml-2 align-middle font-body text-sm font-normal text-cocoa/55">
                    /bulan
                  </span>
                </p>

                <ul className="relative mx-auto mt-8 grid max-w-sm gap-3 text-left text-sm text-cocoa/75">
                  {[
                    "Perencanaan anggaran dan alokasi per kategori",
                    "Pelacakan pengeluaran dan pembayaran vendor",
                    "Pengelolaan vendor beserta bukti pembayaran",
                    "Daftar tugas dan linimasa persiapan",
                    "Daftar tamu dan status RSVP",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-rosewood"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/wedding/signup"
                  className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-rosewood px-7 py-3.5 text-sm font-medium text-ivory shadow-[0_18px_40px_-24px_rgba(168,111,122,0.9)] transition-all hover:-translate-y-0.5 hover:bg-cocoa"
                >
                  Mulai Merencanakan
                  <ArrowRight className="size-4" aria-hidden />
                </Link>

                <p className="relative mt-5 text-xs leading-relaxed text-cocoa/50">
                  Pembayaran online belum tersedia. Tim kami akan membantu
                  proses aktivasi.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-cocoa px-5 py-20 text-center text-ivory">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <FloralCorner className="absolute -left-8 bottom-0 size-56 text-ivory" />
            <FloralCorner className="absolute -right-8 top-0 size-56 rotate-180 text-ivory" />
          </div>

          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-champagne">
              Dengan penuh cinta
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-heading text-4xl leading-[1.12] sm:text-[2.9rem]">
              Persiapan lebih teratur, menyambut hari istimewa{" "}
              <span className="italic text-blush">dengan tenang.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ivory/70 sm:text-base">
              Mulai susun anggaran, atur setiap kebutuhan, dan nikmati perjalanan
              menuju pernikahan Anda dengan lebih terencana.
            </p>
            <Link
              href="/wedding/signup"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-ivory px-7 py-3.5 text-sm font-medium text-cocoa transition-all hover:-translate-y-0.5 hover:bg-blush"
            >
              Mulai Merencanakan
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Reveal>
        </section>

        <footer className="border-t border-blush/70 bg-ivory px-5 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-cocoa/60 sm:flex-row sm:items-end sm:justify-between">
            <BrandLogo />
            <div className="text-center sm:text-right">
              <p>
                Email:{" "}
                <a
                  href="mailto:hello@kefootech"
                  className="font-medium text-rosewood underline-offset-4 hover:underline"
                >
                  hello@kefootech
                </a>
              </p>
              <p className="mt-1 text-xs text-cocoa/45">
                © {new Date().getFullYear()} Kefoo Wedding Planner
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

