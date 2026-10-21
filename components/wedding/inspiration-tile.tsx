"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

export function InspirationTile({
  src,
  alt,
  label,
  ratio,
}: {
  src: string;
  alt: string;
  label: string;
  ratio: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-champagne/40 bg-gradient-to-br from-blush via-dusty/50 to-ivory ${ratio}`}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa/45 via-transparent to-transparent" />

      <span className="absolute bottom-2 left-2 rounded-full bg-ivory/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cocoa/70">
        {label}
      </span>
    </div>
  );
}
