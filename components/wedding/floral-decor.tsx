/**
 * Subtle floral accents behind every app page. Purely decorative:
 * pointer-events-none, aria-hidden, and sits under the content (z-0) so it can
 * never block a click or hide text.
 */

type SprigProps = {
  className: string;
  rotate?: number;
  scale?: number;
};

function Sprig({ className, rotate = 0, scale = 1 }: SprigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg) scale(${scale})` }}
    >
      {/* stem */}
      <path
        d="M60 112C60 96 54 78 44 62c-8-13-14-26-16-40"
        stroke="#D9C3B0"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* leaves */}
      <path d="M52 84c-10-2-17-9-19-18 10-1 17 6 19 18Z" fill="#CBD8C2" opacity="0.75" />
      <path d="M58 70c9-4 14-12 13-21-9 2-13 10-13 21Z" fill="#CBD8C2" opacity="0.6" />
      {/* small buds */}
      <circle cx="36" cy="40" r="4.5" fill="#E8C4C4" />
      <circle cx="28" cy="34" r="3" fill="#D9A6A6" />
      {/* bloom */}
      <g opacity="0.9">
        <circle cx="60" cy="26" r="8.5" fill="#F3D7D7" />
        <circle cx="60" cy="26" r="5" fill="#E8B4B4" />
        <circle cx="60" cy="26" r="2" fill="#C98F8F" />
        <circle cx="47" cy="31" r="6" fill="#F6E2E2" />
        <circle cx="73" cy="31" r="6" fill="#F6E2E2" />
        <circle cx="53" cy="16" r="5.5" fill="#F1D2D2" />
        <circle cx="67" cy="16" r="5.5" fill="#F1D2D2" />
      </g>
    </svg>
  );
}

export function FloralDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <Sprig className="absolute -left-6 top-6 h-28 w-28 opacity-60 sm:h-36 sm:w-36" rotate={-18} />
      <Sprig
        className="absolute -right-8 top-24 h-24 w-24 opacity-50 sm:h-32 sm:w-32"
        rotate={160}
        scale={0.9}
      />
      <Sprig
        className="absolute -right-10 bottom-10 h-28 w-28 opacity-45 sm:h-40 sm:w-40"
        rotate={-140}
      />
      <Sprig
        className="absolute -left-10 bottom-24 h-24 w-24 opacity-40 sm:h-32 sm:w-32"
        rotate={35}
        scale={0.8}
      />
      <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#FBF1EF] blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-[#F7EFE6] blur-3xl" />
    </div>
  );
}
