"use client";

import { useRef, useEffect } from "react";
import { STUDIO_FONTS } from "@/lib/invitation-studio/fonts";
import {
  preloadDraftImages,
  renderDraftToCanvas,
  totalDuration,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/video-studio/render";
import type { VideoDraft } from "@/lib/video-studio/types";

type VideoCanvasProps = {
  draft: VideoDraft;
  time?: number;
  playing?: boolean;
  loop?: boolean;
  className?: string;
  onTimeChange?: (time: number) => void;
  onEnded?: () => void;
};

export function VideoCanvas({
  draft,
  time = 0,
  playing = false,
  loop = true,
  className = "",
  onTimeChange,
  onEnded,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(time);
  const onTimeRef = useRef(onTimeChange);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onTimeRef.current = onTimeChange;
    onEndedRef.current = onEnded;
  }, [onTimeChange, onEnded]);

  useEffect(() => {
    timeRef.current = time;
    const canvas = canvasRef.current;
    if (canvas) renderDraftToCanvas(canvas, draft, time, VIDEO_WIDTH, VIDEO_HEIGHT);
  }, [draft, time]);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    void Promise.all([
      preloadDraftImages(draft),
      ...STUDIO_FONTS.map((font) =>
        document.fonts.load(`16px "${font.name}"`).catch(() => undefined),
      ),
      document.fonts.ready.catch(() => undefined),
    ]).then(() => {
      if (active) {
        renderDraftToCanvas(canvas, draft, timeRef.current, VIDEO_WIDTH, VIDEO_HEIGHT);
      }
    });
    return () => {
      active = false;
    };
  }, [draft]);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const duration = Math.max(0.1, totalDuration(draft.scenes));
    const initial = timeRef.current >= duration ? 0 : timeRef.current;
    let startedAt = performance.now() - initial * 1000;
    let lastReport = 0;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      let next = elapsed;
      if (next >= duration) {
        if (loop) {
          startedAt = now;
          next = 0;
          onEndedRef.current?.();
        } else {
          renderDraftToCanvas(canvas, draft, duration - 0.01, VIDEO_WIDTH, VIDEO_HEIGHT);
          onTimeRef.current?.(duration);
          onEndedRef.current?.();
          return;
        }
      }
      timeRef.current = next;
      renderDraftToCanvas(canvas, draft, next, VIDEO_WIDTH, VIDEO_HEIGHT);
      if (now - lastReport > 100) {
        lastReport = now;
        onTimeRef.current?.(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draft, loop, playing]);

  return (
    <canvas
      ref={canvasRef}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      className={className}
      aria-label="Animated invitation preview"
    />
  );
}
