"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const MAX_OFFSET = 2.5;
const CURSOR_SENSITIVITY = 0.045;
const IDLE_RESET_MS = 500;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

type KeffooEyeProps = {
  pupilStyle: CSSProperties;
};

function KeffooEye({ pupilStyle }: KeffooEyeProps) {
  return (
    <div className="kefoo-eye relative h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.14)] ring-1 ring-blue-400/20 sm:h-5 sm:w-5">
      <div
        className="kefoo-pupil absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-slate-800 sm:h-2.5 sm:w-2.5"
        style={pupilStyle}
      >
        <span className="absolute left-[2px] top-[2px] h-[3px] w-[3px] rounded-full bg-white sm:left-[3px] sm:top-[3px] sm:h-1 sm:w-1" />
      </div>
    </div>
  );
}

export function KeffooLogo({ className }: { className?: string }) {
  const eyesRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();

  const resetOffset = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (prefersReducedMotion || !eyesRef.current) {
        return;
      }

      const rect = eyesRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      setOffset({
        x: Math.max(
          -MAX_OFFSET,
          Math.min(MAX_OFFSET, deltaX * CURSOR_SENSITIVITY),
        ),
        y: Math.max(
          -MAX_OFFSET,
          Math.min(MAX_OFFSET, deltaY * CURSOR_SENSITIVITY),
        ),
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(resetOffset, IDLE_RESET_MS);
    },
    [prefersReducedMotion, resetOffset],
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      resetOffset();
      return;
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [handleMouseMove, prefersReducedMotion, resetOffset]);

  const pupilStyle: CSSProperties = prefersReducedMotion
    ? { transform: "translate(-50%, -50%)" }
    : {
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
      };

  return (
    <div
      className={`relative inline-flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28 ${className ?? ""}`}
      aria-label="KEFOO logo"
    >
      <span
        className="absolute select-none bg-gradient-to-b from-blue-400 to-blue-600 bg-clip-text text-[5.75rem] font-black leading-none tracking-tighter text-transparent sm:text-[7.25rem]"
        aria-hidden
      >
        K
      </span>
      <div
        ref={eyesRef}
        data-kefoo-eyes
        className="relative z-10 flex translate-x-0.5 translate-y-1 items-center gap-2 sm:translate-x-1 sm:translate-y-1.5 sm:gap-2.5"
        aria-hidden
      >
        <KeffooEye pupilStyle={pupilStyle} />
        <KeffooEye pupilStyle={pupilStyle} />
      </div>
    </div>
  );
}

export function KeffooWordmark({ className }: { className?: string }) {
  return (
    <p
      className={`text-center text-sm font-semibold uppercase tracking-[0.35em] text-blue-300/90 pl-[0.35em] ${className ?? ""}`}
    >
      KEFOO
    </p>
  );
}
