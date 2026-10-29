"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Eye,
  Film,
  Loader2,
  Play,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VideoCanvas } from "@/components/video-studio/video-canvas";
import { createDraftFromTemplate } from "@/lib/video-studio/draft";
import { deleteVideoDraft, listVideoDrafts } from "@/lib/video-studio/storage";
import { VIDEO_TEMPLATES } from "@/lib/video-studio/templates";
import type { VideoDraft, VideoTemplate } from "@/lib/video-studio/types";

type CardData = {
  template: VideoTemplate;
  draft: VideoDraft;
};

export function VideoGallery() {
  const cards = useMemo<CardData[]>(
    () =>
      VIDEO_TEMPLATES.map((template) => ({
        template,
        draft: createDraftFromTemplate(template.id) as VideoDraft,
      })),
    [],
  );
  const [preview, setPreview] = useState<CardData | null>(null);
  const [category, setCategory] = useState<"all" | "basic" | "movie">("all");
  const [drafts, setDrafts] = useState<VideoDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const filteredCards = useMemo(
    () =>
      category === "all"
        ? cards
        : cards.filter((card) => card.template.category === category),
    [cards, category],
  );

  useEffect(() => {
    listVideoDrafts()
      .then(setDrafts)
      .catch(() => setDrafts([]))
      .finally(() => setLoadingDrafts(false));
  }, []);

  async function removeDraft(draft: VideoDraft) {
    if (!window.confirm(`Hapus draft "${draft.title}"?`)) return;
    await deleteVideoDraft(draft.id);
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
  }

  return (
    <div className="video-editorial min-h-screen bg-[#f5f0e7] text-cocoa">
      <header className="border-b border-cocoa/10 bg-[#fbf8f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/studio" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-cocoa text-sm font-semibold text-ivory">K</span>
            <span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.26em] text-cocoa/45">Kefoo Studio</span>
              <span className="block font-heading text-lg leading-tight text-cocoa">Video Invitations</span>
            </span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-cocoa/10 bg-white/60 px-3 py-1.5 text-[10px] text-cocoa/55 sm:flex">
            <Clapperboard className="size-3.5" /> Local studio · 9:16 MP4
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9d7d5b]">A moving love letter</p>
          <h1 className="mt-3 font-heading text-4xl leading-[1.08] text-cocoa sm:text-6xl">Your story, in motion.</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cocoa/60 sm:text-base">
            Five Basic and five Movie Inspired templates, each with its own typography, illustrated assets, scene composition, and motion language. Customize the words, photographs, scenes, and motion — then export a real MP4.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] text-cocoa/45">
            <span className="rounded-full bg-white/70 px-3 py-1.5">Demo content</span>
            <span className="rounded-full bg-white/70 px-3 py-1.5">Editable layers</span>
            <span className="rounded-full bg-white/70 px-3 py-1.5">Saved locally</span>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d7d5b]">
                {category === "movie" ? "Movie Inspired collection" : category === "basic" ? "Basic collection" : "All collections"}
              </p>
              <h2 className="mt-1 font-heading text-2xl text-cocoa">Choose a starting point</h2>
            </div>
            <p className="hidden text-xs text-cocoa/45 sm:block">Tap preview to see the motion.</p>
          </div>
          <div className="mb-5 flex flex-wrap gap-2">
            {([
              ["all", "All templates", cards.length],
              ["basic", "Basic", cards.filter((card) => card.template.category === "basic").length],
              ["movie", "Movie Inspired", cards.filter((card) => card.template.category === "movie").length],
            ] as const).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                  category === id
                    ? "bg-cocoa text-ivory"
                    : "border border-cocoa/10 bg-white/65 text-cocoa/55 hover:bg-white"
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${category === id ? "bg-ivory/20" : "bg-cocoa/5"}`}>{count}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredCards.map(({ template, draft }) => (
              <article key={template.id} className="group overflow-hidden rounded-[22px] border border-cocoa/10 bg-[#fbf8f2] p-2 shadow-[0_16px_40px_-28px_rgba(74,46,36,.5)] transition-transform duration-300 hover:-translate-y-1">
                <div className="relative overflow-hidden rounded-[16px] bg-[#eee7db]">
                  <VideoCanvas draft={draft} time={2.7} playing={false} className="block aspect-[9/16] w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">9:16 · Video</span>
                  <button type="button" onClick={() => setPreview({ template, draft })} className="absolute inset-0 flex items-center justify-center bg-transparent transition-colors hover:bg-ink/15" aria-label={`Preview ${template.name}`}>
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/85 text-cocoa opacity-0 shadow-lg transition-opacity group-hover:opacity-100"><Play className="ml-0.5 size-4 fill-current" /></span>
                  </button>
                </div>
                <div className="px-3 pb-3 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg leading-tight text-cocoa">{template.name}</h3>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#9d7d5b]">{template.styleLabel}</p>
                    </div>
                    <span className="mt-0.5 rounded-full bg-[#e9dfd0] px-2 py-1 text-[8px] font-medium text-cocoa/60">
                      {template.category === "movie" ? "MOVIE" : "BASIC"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 min-h-[3.3rem] text-[11px] leading-relaxed text-cocoa/55">{template.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setPreview({ template, draft })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-cocoa/15 bg-white px-2.5 py-2 text-[10px] font-semibold text-cocoa/70 hover:bg-[#f2ece1]"><Eye className="size-3" /> Preview</button>
                    <Link href={`/studio/video/editor?template=${template.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-cocoa px-2.5 py-2 text-[10px] font-semibold text-ivory hover:bg-cocoa/90"><Sparkles className="size-3" /> Customize</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>


        <section className="mt-16 grid gap-6 rounded-[24px] border border-cocoa/10 bg-[#fbf8f2] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <div className="flex items-center gap-2 text-[#9d7d5b]"><Film className="size-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.22em]">How it works</p></div>
            <h2 className="mt-2 font-heading text-2xl text-cocoa">From draft to downloadable film</h2>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-cocoa/55">Fill in your real details, upload your photographs, arrange the four scenes, and render. The export uses the same Canvas renderer as the live preview, so what you see is what you download.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] text-cocoa/50 sm:w-64">
            <span className="rounded-xl bg-[#f0e9dd] px-2 py-3"><strong className="block font-heading text-lg text-cocoa">1</strong>Customize</span>
            <span className="rounded-xl bg-[#f0e9dd] px-2 py-3"><strong className="block font-heading text-lg text-cocoa">2</strong>Preview</span>
            <span className="rounded-xl bg-[#f0e9dd] px-2 py-3"><strong className="block font-heading text-lg text-cocoa">3</strong>Export MP4</span>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d7d5b]">Your workspace</p>
              <h2 className="mt-1 font-heading text-2xl text-cocoa">Saved drafts</h2>
            </div>
            {loadingDrafts ? <Loader2 className="size-4 animate-spin text-cocoa/35" /> : null}
          </div>
          {!loadingDrafts && drafts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-cocoa/15 bg-white/45 px-6 py-10 text-center">
              <p className="text-sm text-cocoa/55">Belum ada draft. Pilih template di atas untuk mulai.</p>
              <p className="mt-1 text-[10px] text-cocoa/35">Draft disimpan lokal di browser ini.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between gap-3 rounded-2xl border border-cocoa/10 bg-[#fbf8f2] p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cocoa">{draft.title}</p>
                    <p className="mt-1 text-[10px] text-cocoa/45">{draft.templateName} · {new Date(draft.updatedAt).toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/studio/video/editor?draft=${draft.id}`} className="rounded-full bg-cocoa px-3 py-1.5 text-[10px] font-medium text-ivory">Open</Link>
                    <button type="button" onClick={() => void removeDraft(draft)} className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${draft.title}`}><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Video preview ${preview.template.name}`}>
          <div className="max-h-[94vh] w-full max-w-sm overflow-auto rounded-2xl bg-[#fbf8f2] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="font-heading text-base text-cocoa">{preview.template.name}</p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-cocoa/40">Animated preview · demo content</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-cocoa/50 hover:bg-white" aria-label="Close video preview"><X className="size-4" /></button>
            </div>
            <VideoCanvas draft={preview.draft} playing loop className="mx-auto block w-full rounded-xl shadow-lg" />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[10px] text-cocoa/45">Native MP4 renderer · 9:16</p>
              <Link href={`/studio/video/editor?template=${preview.template.id}`} onClick={() => setPreview(null)} className="inline-flex items-center gap-1 rounded-full bg-cocoa px-3 py-2 text-[10px] font-medium text-ivory">Customize <ArrowRight className="size-3" /></Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

