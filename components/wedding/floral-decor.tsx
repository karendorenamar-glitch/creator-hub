/**
 * Floral accents behind every app page. Decorative only: pointer-events-none,
 * aria-hidden, painted under the content so nothing is ever blocked.
 */

type SprigProps = { className: string; rotate?: number; scale?: number };

function Sprig({ className, rotate = 0, scale = 1 }: SprigProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg) scale(${scale})` }}
    >
      <path
        d="M60 114C60 96 54 78 44 62c-8-13-14-26-16-40"
        stroke="#C9A98F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M52 84c-12-2-20-10-22-21 12-1 20 8 22 21Z" fill="#B9C9AE" />
      <path d="M58 68c10-4 16-13 15-24-10 3-15 12-15 24Z" fill="#A9BC9C" />
      <circle cx="35" cy="40" r="6" fill="#E7A5A5" />
      <circle cx="26" cy="33" r="4" fill="#D28080" />
      <g>
        <circle cx="60" cy="26" r="10" fill="#F0BDBD" />
        <circle cx="60" cy="26" r="6" fill="#DE9A9A" />
        <circle cx="60" cy="26" r="2.6" fill="#A9605F" />
        <circle cx="45" cy="32" r="7" fill="#F4CCCC" />
        <circle cx="75" cy="32" r="7" fill="#F4CCCC" />
        <circle cx="51" cy="14" r="6.5" fill="#EBB6B6" />
        <circle cx="69" cy="14" r="6.5" fill="#EBB6B6" />
      </g>
    </svg>
  );
}

export function FloralDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#FDF3F0_0%,transparent_45%),radial-gradient(circle_at_bottom_right,#FBF4EC_0%,transparent_40%)]" />

      <Sprig className="absolute -left-4 top-2 h-32 w-32 opacity-90 sm:h-44 sm:w-44" rotate={-16} />
      <Sprig className="absolute -right-6 top-16 h-28 w-28 opacity-80 sm:h-40 sm:w-40" rotate={158} scale={0.9} />
      <Sprig className="absolute -right-8 bottom-6 h-32 w-32 opacity-85 sm:h-48 sm:w-48" rotate={-142} />
      <Sprig className="absolute -left-8 bottom-20 h-28 w-28 opacity-75 sm:h-40 sm:w-40" rotate={32} scale={0.85} />
      <Sprig className="absolute left-1/3 -top-8 h-24 w-24 opacity-60 sm:h-32 sm:w-32" rotate={8} scale={0.7} />
      <Sprig className="absolute right-1/4 -bottom-10 h-24 w-24 opacity-60 sm:h-36 sm:w-36" rotate={-172} scale={0.75} />
    </div>
  );
}
