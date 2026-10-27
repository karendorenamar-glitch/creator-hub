import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import {
  ArticleCta,
  ArticleFooter,
  ArticleMeta,
  PublicSeoShell,
} from "@/components/wedding/public-seo-shell";
import { budgetArticles, findBudgetArticle } from "@/lib/wedding/budget-articles";
import { KEFOO_OG_IMAGE, KEFOO_SITE_URL } from "@/lib/wedding/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return budgetArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = findBudgetArticle(slug);
  if (!article) return {};
  const url = `${KEFOO_SITE_URL}/wedding-budget-planner/${article.slug}`;
  return {
    title: { absolute: article.seoTitle },
    description: article.description,
    alternates: { canonical: `/wedding-budget-planner/${article.slug}` },
    openGraph: {
      title: article.seoTitle,
      description: article.description,
      url,
      siteName: "Kefoo",
      locale: "id_ID",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [KEFOO_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.description,
      images: [KEFOO_OG_IMAGE.url],
    },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default async function BudgetArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = findBudgetArticle(slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: "id-ID",
    author: {
      "@type": "Organization",
      name: "Kefoo",
      url: KEFOO_SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Kefoo",
      url: KEFOO_SITE_URL,
    },
    mainEntityOfPage: `${KEFOO_SITE_URL}/wedding-budget-planner/${article.slug}`,
    image: `${KEFOO_SITE_URL}${KEFOO_OG_IMAGE.url}`,
  };

  return (
    <PublicSeoShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:pt-14">
        <Link
          href="/wedding-budget-planner"
          className="inline-flex items-center gap-2 text-xs font-medium text-cocoa/55 hover:text-rosewood"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Panduan budget pernikahan
        </Link>

        <div className="mt-7">
          <ArticleMeta />
          <h1 className="mt-4 font-heading text-4xl leading-[1.08] text-cocoa sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-cocoa/70">
            {article.intro}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cocoa/45">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDate(article.publishedAt)}
            </span>
            <span>Ditulis oleh tim Kefoo</span>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-2xl leading-tight text-cocoa">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-cocoa/70">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-4 space-y-2 rounded-2xl border border-blush/60 bg-white/60 p-4 text-sm text-cocoa/70">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-sage"
                        aria-hidden
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-champagne/60 bg-blush/25 p-4 text-sm leading-relaxed text-cocoa/70">
          Angka dalam artikel ini bersifat ilustratif. Harga, pajak, biaya
          layanan, dan kebutuhan setiap pernikahan dapat berbeda.
        </div>

        <div className="mt-10 border-t border-blush/60 pt-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-rosewood">
            Baca juga
          </p>
          <div className="mt-3 space-y-2">
            {article.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-blush/60 bg-white/60 px-3.5 py-3 text-sm text-cocoa hover:border-rosewood/40 hover:text-rosewood"
              >
                {item.label}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <ArticleCta />
        </div>
        <div className="mt-6">
          <ArticleFooter />
        </div>
      </article>
    </PublicSeoShell>
  );
}
