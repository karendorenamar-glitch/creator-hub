"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { CalendarDays, MapPin, Music2, Pause } from "lucide-react";
import { RsvpForm } from "@/components/wedding/invitation/rsvp-form";
import type { InvitationContent, InvitationTemplateKey } from "@/lib/wedding/db-types";
import { formatWeddingDate } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export type PublicInvitation = {
  id: string;
  slug: string;
  template: InvitationTemplateKey;
  content: InvitationContent;
  coverUrl: string | null;
  coupleUrl: string | null;
  partner_one_name: string;
  partner_two_name: string | null;
  wedding_date: string | null;
  location: string | null;
};


const THEMES = {
  elegant: {
    page: "bg-cream text-ink",
    accent: "text-olive-600",
    card: "border-olive-100 bg-white/80",
    footer: "bg-olive-50",
    button: "bg-olive-600 text-white",
    overlay: "bg-gradient-to-b from-ink/50 via-ink/35 to-ink/70",
    coverTitle: "font-heading",
    coverBg: "bg-cream",
    coverButton: "bg-white text-ink",
    scope: "",
  },
  garden: {
    page: "bg-[#eef4e6] text-[#2f3a2a]",
    accent: "text-[#4f6b3c]",
    card: "border-[#cfdcc0] bg-white",
    footer: "bg-[#dfead2]",
    button: "bg-[#5f7a4a] text-white",
    overlay: "bg-gradient-to-b from-[#2f3a2a]/45 via-[#2f3a2a]/25 to-[#2f3a2a]/60",
    coverTitle: "font-heading italic",
    coverBg: "bg-[#eef4e6]",
    coverButton: "bg-[#5f7a4a] text-white",
    scope: "",
  },
  luxury: {
    page: "bg-[#141310] text-[#f4ead6]",
    accent: "text-[#c9a86a]",
    card: "border-[#c9a86a]/40 bg-[#1d1a14]",
    footer: "bg-[#0f0e0b]",
    button: "bg-[#c9a86a] text-[#141310]",
    overlay: "bg-gradient-to-b from-black/70 via-black/55 to-black/85",
    coverTitle: "font-heading uppercase tracking-[0.14em]",
    coverBg: "bg-[#141310]",
    coverButton: "bg-[#c9a86a] text-[#141310]",
    scope: "inv-luxury",
  },
};

function Countdown({ date, copy }: { date: string | null; copy: ModuleCopy }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!date) return;
    const target = new Date(`${date}T00:00:00`).getTime();

    function tick() {
      setLeft(target - Date.now());
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [date]);

  if (!date || left === null) return null;

  const total = Math.max(0, left);
  const parts: [number, string][] = [
    [Math.floor(total / 86_400_000), copy.invitation.days],
    [Math.floor((total % 86_400_000) / 3_600_000), copy.invitation.hours],
    [Math.floor((total % 3_600_000) / 60_000), copy.invitation.minutes],
    [Math.floor((total % 60_000) / 1000), copy.invitation.seconds],
  ];

  return (
    <div className="flex items-center justify-center gap-3 text-center">
      {parts.map(([value, label]) => (
        <div key={label} className="min-w-16 rounded-2xl bg-white/70 px-3 py-2">
          <p className="font-heading text-2xl text-ink">{value}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function InvitationTemplate({
  data,
  copy,
  locale,
}: {
  data: PublicInvitation;
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const content = data.content;
  const theme = THEMES[data.template] ?? THEMES.elegant;
  const dateLabel = formatWeddingDate(data.wedding_date, locale);

  useEffect(() => {
    if (!opened || !audioRef.current) return;
    audioRef.current.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [opened]);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  if (!opened) {
    return (
      <main className={`relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center ${theme.coverBg}`}>
        {(data.coverUrl ?? content.coverImageUrl) ? (
          <img
            src={data.coverUrl ?? content.coverImageUrl ?? ""}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div className={`absolute inset-0 ${theme.overlay}`} />
        <div className="relative z-10 max-w-md text-white">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/80">
            {content.tagline || copy.invitation.title}
          </p>
          <h1 className={`mt-4 text-4xl leading-tight sm:text-5xl ${theme.coverTitle}`}>
            {data.partner_one_name}
            <span className="mx-2 text-white/60">&</span>
            {data.partner_two_name}
          </h1>
          <p className="mt-4 text-sm text-white/85">{dateLabel ?? ""}</p>
          <button
            type="button"
            onClick={() => setOpened(true)}
            className={`mt-8 rounded-full px-7 py-3 text-sm font-medium shadow-lg transition-transform hover:scale-105 ${theme.coverButton}`}
          >
            {copy.invitation.openInvitation}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`${theme.page} ${theme.scope}`}>
      {content.musicUrl ? (
        <>
          <audio ref={audioRef} src={content.musicUrl} loop preload="none" />
          <button
            type="button"
            onClick={toggleMusic}
            aria-label="Music"
            className={`fixed bottom-5 right-5 z-40 rounded-full p-3 shadow-lg ${theme.button}`}
          >
            {playing ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Music2 className="size-5" aria-hidden />
            )}
          </button>
        </>
      ) : null}

      <section className="mx-auto flex max-w-2xl flex-col items-center px-5 pb-14 pt-16 text-center">
        <p className={`text-[11px] uppercase tracking-[0.35em] ${theme.accent}`}>
          {content.tagline || copy.invitation.title}
        </p>
        <h1 className={`mt-4 text-4xl leading-tight sm:text-5xl ${theme.coverTitle}`}>
          {data.partner_one_name}
          <span className={`mx-2 ${theme.accent}`}>&</span>
          {data.partner_two_name}
        </h1>
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
          <CalendarDays className="size-4" aria-hidden />
          {dateLabel ?? ""}
        </p>
        {data.location ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
            <MapPin className="size-4" aria-hidden />
            {data.location}
          </p>
        ) : null}

        <div className="mt-8">
          <Countdown date={data.wedding_date} copy={copy} />
        </div>

        {(data.coupleUrl ?? content.coupleImageUrl) ? (
          <img
            src={data.coupleUrl ?? content.coupleImageUrl ?? ""}
            alt=""
            className="mt-10 w-full max-w-md rounded-3xl object-cover"
          />
        ) : null}
      </section>

      {content.story ? (
        <section className="mx-auto max-w-xl px-5 py-12 text-center">
          <h2 className="font-heading text-2xl">{copy.invitation.loveStory}</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {content.story}
          </p>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-3xl gap-5 px-5 py-8 sm:grid-cols-2">
        <div className={`rounded-3xl border p-6 text-center ${theme.card}`}>
          <h3 className="font-heading text-xl">{copy.invitation.ceremony}</h3>
          <p className="mt-2 text-sm text-ink-soft">{content.ceremonyTime}</p>
          <p className="mt-1 text-sm text-ink">{content.ceremonyPlace}</p>
        </div>
        <div className={`rounded-3xl border p-6 text-center ${theme.card}`}>
          <h3 className="font-heading text-xl">{copy.invitation.reception}</h3>
          <p className="mt-2 text-sm text-ink-soft">{content.receptionTime}</p>
          <p className="mt-1 text-sm text-ink">{content.receptionPlace}</p>
        </div>
      </section>

      {content.venueAddress || content.mapsUrl ? (
        <section className="mx-auto max-w-xl px-5 py-10 text-center">
          <h2 className="font-heading text-2xl">{copy.invitation.venue}</h2>
          {content.venueAddress ? (
            <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">
              {content.venueAddress}
            </p>
          ) : null}
          {content.mapsUrl ? (
            <a
              href={content.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-medium ${theme.button}`}
            >
              Google Maps
            </a>
          ) : null}
        </section>
      ) : null}

      {content.dressCode ? (
        <section className="mx-auto max-w-xl px-5 py-8 text-center">
          <h2 className="font-heading text-2xl">
            {copy.invitation.dressCodeTitle}
          </h2>
          <p className="mt-3 text-sm text-ink-soft">{content.dressCode}</p>
        </section>
      ) : null}

      <section className="mx-auto max-w-xl px-5 py-10">
        <h2 className="text-center font-heading text-2xl">
          {copy.invitation.rsvpTitle}
        </h2>
        <div className="mt-5">
          <RsvpForm slug={data.slug} copy={copy} />
        </div>
      </section>

      <footer className={`px-5 py-14 text-center ${theme.footer}`}>
        <p className="text-[11px] uppercase tracking-[0.3em] text-olive-600">
          {copy.invitation.closingTitle}
        </p>
        <p className="mt-3 font-heading text-2xl">
          {data.partner_one_name} & {data.partner_two_name}
        </p>
        <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm text-ink-soft">
          {content.closingMessage}
        </p>
      </footer>

    </main>
  );
}
