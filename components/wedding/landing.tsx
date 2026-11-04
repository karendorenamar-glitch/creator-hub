import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Images,
  ListChecks,
  Star,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/wedding/brand-logo";
import { InspirationTile } from "@/components/wedding/inspiration-tile";
import { LanguageSwitcher } from "@/components/wedding/language-switcher";
import { landingCopy } from "@/lib/wedding/landing-copy";
import type { AppLocale } from "@/lib/i18n/types";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-rosewood">
      <span className="h-px w-8 bg-champagne" aria-hidden />
      {children}
    </p>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div className="landing-fade" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function Floral({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" aria-hidden className={className}>
      <path d="M60 138V46" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
      <path d="M60 96C38 90 24 74 22 50c24 2 38 18 38 46Z" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <path d="M60 74c22-6 36-22 38-46-24 2-38 18-38 46Z" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
      <circle cx="60" cy="30" r="12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function WeddingLanding({ locale }: { locale: AppLocale }) {
  const copy = landingCopy[locale];

  return (
    <div className="wedding-app wedding-surface min-h-screen text-cocoa">
      <header className="sticky top-0 z-40 border-b border-blush/60 bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-cocoa/70 md:flex">
            {copy.nav.map(({ label, href }) => (
              <a key={href} href={href} className="group relative py-1 transition-colors hover:text-rosewood">
                {label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px scale-x-0 bg-champagne transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <Link href="/wedding/login" className="rounded-full px-3 py-2 text-sm font-medium text-cocoa/70 hover:bg-blush/50 hover:text-cocoa">
              {copy.header.login}
            </Link>
            <Link href="/wedding/signup" className="rounded-full bg-rosewood px-4 py-2 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa">
              {copy.header.signup}
            </Link>
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-full border border-blush px-3 py-2 text-xs text-cocoa/70">
                {copy.header.menu}
              </summary>
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-blush bg-ivory p-2 shadow-xl">
                <div className="px-2 pb-2">
                  <LanguageSwitcher locale={locale} />
                </div>
                {copy.nav.map(({ label, href }) => (
                  <a key={href} href={href} className="block rounded-xl px-3 py-2 text-sm text-cocoa/75 hover:bg-blush/40">
                    {label}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-14 pt-10 sm:pt-12">
          <div className="pointer-events-none absolute -left-10 top-24 hidden text-champagne/60 sm:block">
            <Floral className="landing-float size-24" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Reveal>
                <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="mt-5 font-heading text-[2.4rem] leading-[1.06] tracking-tight text-cocoa sm:text-5xl lg:text-[3.4rem]">
                  {copy.hero.title}
                  <br className="hidden sm:block" />{" "}
                  <span className="italic text-rosewood">{copy.hero.titleAccent}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-cocoa/70">
                  {copy.hero.body}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href="/checkout" className="group inline-flex items-center gap-2 rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory shadow-[0_16px_36px_-24px_rgba(168,111,122,0.9)] transition-all hover:-translate-y-0.5 hover:bg-cocoa">
                    {copy.hero.ctaPrimary}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <a href="#fitur" className="inline-flex items-center gap-2 rounded-full border border-champagne/60 px-5 py-3 text-sm font-medium text-cocoa hover:bg-blush/40">
                    {copy.hero.ctaSecondary}
                  </a>
                </div>
                <p className="mt-4 text-xs text-cocoa/50">
                  {copy.hero.footnote}
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex -space-x-2" aria-hidden>
                    {copy.testimonials.items.map((item) => (
                      <span
                        key={item.initials}
                        className="flex size-9 items-center justify-center rounded-full border-2 border-ivory bg-gradient-to-br from-petal-100 to-blush text-[10px] font-semibold text-rosewood"
                      >
                        {item.initials}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 text-rosewood">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className="size-3.5 fill-current"
                          aria-hidden
                        />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-cocoa/60">
                      <strong className="font-semibold text-cocoa">
                        {copy.hero.proofCount}
                      </strong>{" "}
                      {copy.hero.proofRest}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <div className="relative">
                <div className="absolute -right-4 -top-6 z-10 w-40 rounded-2xl border border-champagne/60 bg-ivory/95 p-3 shadow-[0_18px_40px_-30px_rgba(87,66,63,0.7)]">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-rosewood">
                    <CalendarDays className="size-3.5" aria-hidden /> {copy.hero.countdownLabel}
                  </p>
                  <p className="mt-1 font-heading text-xl text-cocoa">{copy.hero.countdownDays}</p>
                  <p className="text-[10px] text-cocoa/55">{copy.hero.countdownRest}</p>
                </div>

                <div className="overflow-hidden rounded-[1.6rem] border border-champagne/50 bg-ivory shadow-[0_40px_90px_-65px_rgba(87,66,63,0.65)]">
                  <div className="flex items-center gap-1.5 border-b border-blush/60 bg-blush/25 px-4 py-2.5">
                    <span className="size-2 rounded-full bg-dusty/70" />
                    <span className="size-2 rounded-full bg-champagne/70" />
                    <span className="size-2 rounded-full bg-sage" />
                    <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-cocoa/40">
                      kefoo · dashboard
                    </span>
                  </div>

                  <div className="flex">
                    <div className="hidden w-28 shrink-0 border-r border-blush/60 bg-blush/15 p-3 sm:block">
                      {copy.preview.nav.map((item, i) => (
                        <p
                          key={item}
                          className={`mb-1 rounded-lg px-2 py-1.5 text-[10px] ${
                            i === 0 ? "bg-ivory text-rosewood" : "text-cocoa/45"
                          }`}
                        >
                          {item}
                        </p>
                      ))}
                    </div>

                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-heading text-sm text-cocoa">Hailey &amp; Justin</p>
                          <p className="text-[10px] text-cocoa/45">12 Mei 2027 · Jakarta</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          [copy.preview.total, "Rp 150 jt"],
                          [copy.preview.paid, "Rp 45 jt"],
                          [copy.preview.remaining, "Rp 105 jt"],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-blush/70 bg-white/80 px-2 py-2">
                            <p className="text-[8px] uppercase tracking-[0.1em] text-cocoa/40">{label}</p>
                            <p className="mt-0.5 font-heading text-[11px] text-cocoa">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-[9px] text-cocoa/50">
                          <span>{copy.preview.paidProgress}</span>
                          <span>30%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blush/60">
                          <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-dusty to-rosewood" />
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {[
                          ["Catering", copy.preview.statusDeposit, "bg-champagne/25 text-cocoa/70"],
                          ["Dekorasi", copy.preview.statusPaid, "bg-sage/60 text-cocoa/70"],
                        ].map(([name, status, tone]) => (
                          <div key={name} className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1.5">
                            <span className="text-[10px] text-cocoa/75">{name}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[8px] ${tone}`}>{status}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush/60">
                          <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-sage to-dusty" />
                        </div>
                        <span className="text-[9px] text-cocoa/45">{copy.preview.checklist}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-4 hidden w-36 rounded-2xl border border-blush bg-ivory/95 p-3 shadow-[0_18px_40px_-30px_rgba(87,66,63,0.6)] sm:block">
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-rosewood">
                    <Images className="size-3" aria-hidden /> {copy.preview.inspiration}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {[
                      ["/inspiration/dekorasi.jpg", "Dekorasi pernikahan"],
                      ["/inspiration/mua.jpg", "Tata rias pengantin"],
                      ["/inspiration/attire.jpg", "Venue pernikahan"],
                    ].map(([src, alt]) => (
                      <img
                        key={src}
                        src={src}
                        alt={alt}
                        loading="lazy"
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[9px] text-cocoa/50">{copy.preview.inspirationTags}</p>
                </div>
              </div>
            </Reveal>

          </div>
        </section>

        <section id="inspirasi" className="border-y border-blush/60 bg-blush/30 px-5 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <Reveal>
              <Eyebrow>{copy.inspiration.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-heading text-3xl leading-[1.1] text-cocoa sm:text-[2.6rem]">
                {copy.inspiration.title}{" "}
                <span className="italic text-rosewood">{copy.inspiration.titleAccent}</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-cocoa/70 sm:text-base">
                {copy.inspiration.body}
              </p>
              <Link
                href="/checkout"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rosewood px-5 py-2.5 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa"
              >
                {copy.inspiration.cta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {copy.inspiration.tiles.map((tile) => (
                  <InspirationTile
                    key={tile.label}
                    src={tile.src}
                    alt={tile.alt}
                    label={tile.label}
                    ratio={tile.tone === "square" ? "aspect-square" : tile.tone === "tall" ? "aspect-[4/5]" : "aspect-[3/4]"}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-cocoa/50">
                {copy.inspiration.footnote}
              </p>
            </Reveal>
          </div>
        </section>

        <section id="fitur" className="px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Eyebrow>{copy.features.eyebrow}</Eyebrow>
              <h2 className="mt-4 max-w-2xl font-heading text-3xl leading-[1.1] text-cocoa sm:text-[2.5rem]">
                {copy.features.title}{" "}
                <span className="italic text-rosewood">{copy.features.titleAccent}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cocoa/70">
                {copy.features.body}
              </p>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article id="anggaran" className="rounded-3xl border border-blush/70 bg-white/80 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-champagne">
                  <Wallet className="size-3.5" aria-hidden /> {copy.features.cards.budget.tag}
                </span>
                <h3 className="mt-2 font-heading text-xl text-cocoa">{copy.features.cards.budget.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {copy.features.cards.budget.body}
                </p>
                <Link
                  href="/wedding-budget-planner"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-rosewood hover:underline"
                >
                  {copy.features.cards.budget.link}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
                <div className="mt-4 rounded-2xl bg-ivory p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-cocoa/45">Total</span>
                    <span className="font-heading text-base text-cocoa">Rp 150 jt</span>
                  </div>
                  {[
                    [locale === "en" ? "Allocated" : "Dialokasikan", 61, "from-sage to-dusty"],
                    [locale === "en" ? "Paid" : "Dibayar", 30, "from-dusty to-rosewood"],
                  ].map(([label, pct, tone]) => (
                    <div key={String(label)} className="mt-2.5">
                      <div className="flex justify-between text-[10px] text-cocoa/55">
                        <span>{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blush/60">
                        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="mt-2.5 text-[10px] text-cocoa/50">{locale === "en" ? "Rp 105 jt left" : "Sisa Rp 105 jt"}</p>
                </div>
              </article>

              <article className="rounded-3xl border border-blush/70 bg-white/80 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-champagne">
                  <CheckCircle2 className="size-3.5" aria-hidden /> {copy.features.cards.expenses.tag}
                </span>
                <h3 className="mt-2 font-heading text-xl text-cocoa">{copy.features.cards.expenses.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {copy.features.cards.expenses.body}
                </p>
                <div className="mt-4 space-y-1.5 rounded-2xl bg-ivory p-4">
                  {copy.features.expenseRows.map(({ name, amount, status }) => (
                    <div key={name} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5">
                      <span className="text-[11px] text-cocoa">{name} · {amount}</span>
                      <span className="rounded-full bg-blush/60 px-2 py-0.5 text-[9px] text-cocoa/70">{status}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-blush/70 bg-white/80 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-champagne">
                  <Store className="size-3.5" aria-hidden /> {copy.features.cards.vendors.tag}
                </span>
                <h3 className="mt-2 font-heading text-xl text-cocoa">{copy.features.cards.vendors.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {copy.features.cards.vendors.body}
                </p>
                <div className="mt-4 space-y-1.5 rounded-2xl bg-ivory p-4">
                  {copy.features.vendorRows.map(({ name, status }) => (
                    <div key={name} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5">
                      <span className="text-[11px] text-cocoa">{name}</span>
                      <span className="rounded-full bg-sage/60 px-2 py-0.5 text-[9px] text-cocoa/70">{status}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-blush/70 bg-white/80 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-champagne">
                  <ListChecks className="size-3.5" aria-hidden /> {copy.features.cards.planning.tag}
                </span>
                <h3 className="mt-2 font-heading text-xl text-cocoa">{copy.features.cards.planning.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/65">
                  {copy.features.cards.planning.body}
                </p>
                <div className="mt-4 rounded-2xl bg-ivory p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush/60">
                      <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-sage to-dusty" />
                    </div>
                    <span className="text-[10px] text-cocoa/55">3/5</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-cocoa">
                      <Users className="size-3.5 text-rosewood" aria-hidden /> {copy.features.cards.planning.guests}
                    </span>
                    <span className="text-[10px] text-cocoa/55">{copy.features.cards.planning.attending}</span>
                  </div>
                </div>
              </article>

            </div>

          </div>
        </section>

        <section id="testimoni" className="border-y border-blush/60 bg-blush/20 px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <Reveal>
                <Eyebrow>{copy.testimonials.eyebrow}</Eyebrow>
                <h2 className="mt-4 max-w-xl font-heading text-3xl leading-[1.1] text-cocoa sm:text-[2.5rem]">
                  {copy.testimonials.title}{" "}
                  <span className="italic text-rosewood">{copy.testimonials.titleAccent}</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-cocoa/70">
                  {copy.testimonials.body}
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="inline-flex items-center gap-3 rounded-2xl border border-champagne/60 bg-ivory/80 px-4 py-3">
                  <div className="flex -space-x-2" aria-hidden>
                    {copy.testimonials.items.map((item) => (
                      <span
                        key={item.initials}
                        className="flex size-8 items-center justify-center rounded-full border-2 border-ivory bg-gradient-to-br from-petal-100 to-blush text-[9px] font-semibold text-rosewood"
                      >
                        {item.initials}
                      </span>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 text-rosewood">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className="size-3 fill-current"
                          aria-hidden
                        />
                      ))}
                    </div>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] text-cocoa/60">
                      <strong className="font-semibold text-cocoa">100+ pasangan</strong>{" "}
                      sudah menggunakan Kefoo
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {copy.testimonials.items.map((item, index) => (
                <Reveal key={item.name} delay={index * 0.06}>
                  <figure className="flex h-full flex-col rounded-3xl border border-blush/70 bg-ivory/85 p-5 shadow-[0_20px_50px_-45px_rgba(87,66,63,0.6)]">
                    <div className="flex items-center gap-0.5 text-champagne">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star
                          key={star}
                          className="size-3.5 fill-current"
                          aria-hidden
                        />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-cocoa/75">
                      “{item.quote}”
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-blush/60 pt-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-petal-100 to-blush text-[10px] font-semibold text-rosewood">
                        {item.initials}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-cocoa">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-cocoa/50">
                          {copy.testimonials.author}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-blush/60 bg-sage/25 px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Eyebrow>{copy.steps.eyebrow}</Eyebrow>
              <h2 className="mt-3 font-heading text-3xl text-cocoa sm:text-[2.3rem]">{copy.steps.title}</h2>
            </Reveal>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {copy.steps.items.map(({ no, title, body }, index) => (
                <Reveal key={no} delay={index * 0.05}>
                  <div className="h-full rounded-2xl border border-champagne/40 bg-ivory/85 p-5">
                    <p className="font-heading text-2xl italic text-champagne">{no}</p>
                    <h3 className="mt-2 font-heading text-lg text-cocoa">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-cocoa/65">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>



        <section id="harga" className="px-5 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-rosewood">{copy.pricing.label}</p>
              <h2 className="mx-auto mt-4 max-w-2xl font-heading text-3xl leading-[1.1] text-cocoa sm:text-[2.5rem]">
                {copy.pricing.title}{" "}
                <span className="italic text-rosewood">{copy.pricing.titleAccent}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cocoa/70">
                {copy.pricing.body}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-champagne/60 bg-blush/35 p-8 sm:p-10">
                <p className="font-heading text-5xl text-cocoa sm:text-6xl">{copy.pricing.price}</p>
                <p className="mt-3 text-sm text-cocoa/70">{copy.pricing.note}</p>
                <ul className="mx-auto mt-6 grid max-w-sm gap-2 text-left text-sm text-cocoa/75">
                  {copy.pricing.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-rosewood" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/checkout"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa"
                >
                  {copy.pricing.cta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-blush/60 bg-ivory px-5 py-16 text-center">
          <div className="pointer-events-none absolute -left-6 bottom-0 hidden text-champagne/40 sm:block">
            <Floral className="size-32" />
          </div>
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-heading text-3xl leading-[1.12] text-cocoa sm:text-[2.5rem]">
              {copy.finalCta.title}{" "}
              <span className="italic text-rosewood">{copy.finalCta.titleAccent}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cocoa/70">
              {copy.finalCta.body}
            </p>
            <Link
              href="/checkout"
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-rosewood px-6 py-3 text-sm font-medium text-ivory transition-all hover:-translate-y-0.5 hover:bg-cocoa"
            >
              {copy.finalCta.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-blush/70 bg-blush/25 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-sm text-cocoa/60 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs text-center sm:text-left">
            <BrandLogo />
            <p className="mt-3 text-xs leading-relaxed text-cocoa/55">
              {copy.footer.body}
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
            {copy.nav.map(({ label, href }) => (
              <a key={href} href={href} className="hover:text-rosewood">
                {label}
              </a>
            ))}
            <Link href="/wedding/login" className="hover:text-rosewood">{copy.footer.login}</Link>
            <Link href="/wedding/signup" className="hover:text-rosewood">{copy.footer.signup}</Link>
            <Link href="/privacy" className="hover:text-rosewood">{copy.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-rosewood">{copy.footer.terms}</Link>
            <Link href="/refund" className="hover:text-rosewood">{copy.footer.refund}</Link>
          </nav>

          <div className="text-center text-xs sm:text-right">
            <p>
              Email:{" "}
              <a href="mailto:hello@kefoo.tech" className="font-medium text-rosewood underline-offset-4 hover:underline">
                hello@kefoo.tech
              </a>
            </p>
            <p className="mt-1 text-cocoa/45">© {new Date().getFullYear()} Kefoo Wedding Planner</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
