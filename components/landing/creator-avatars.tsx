import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  className?: string;
};

function AvatarFrame({
  children,
  className,
  bg,
}: AvatarProps & { children: ReactNode; bg: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-white", className)}
    >
      <rect width="64" height="64" fill={bg} />
      {children}
    </svg>
  );
}

export function KarenAvatar({ className }: AvatarProps) {
  return (
    <AvatarFrame className={className} bg="#312e81">
      <ellipse cx="32" cy="58" rx="18" ry="10" fill="#1e1b4b" opacity="0.35" />
      <path
        d="M16 34c2-12 10-18 16-18s14 6 16 18c-4 2-8 3-16 3s-12-1-16-3Z"
        fill="#4c1d95"
      />
      <path
        d="M18 28c3-10 8-14 14-14s11 4 14 14c-3 1-7 2-14 2s-11-1-14-2Z"
        fill="#b887f8"
      />
      <circle cx="32" cy="30" r="13" fill="#fcd9bd" />
      <circle cx="27" cy="29" r="1.6" fill="#3f2a1d" />
      <circle cx="37" cy="29" r="1.6" fill="#3f2a1d" />
      <path d="M28 35q4 3 8 0" stroke="#c08457" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 24c2-6 6-9 12-9s10 3 12 9" fill="#4c1d95" />
    </AvatarFrame>
  );
}

export function AlyaAvatar({ className }: AvatarProps) {
  return (
    <AvatarFrame className={className} bg="#f5e8ff">
      <ellipse cx="32" cy="58" rx="18" ry="10" fill="#e9d5ff" opacity="0.9" />
      <path
        d="M12 37c4-12 12-18 20-18s16 6 20 18c-6 2-12 3-20 3s-14-1-20-3Z"
        fill="#ddd6fe"
      />
      <path
        d="M14 30c4-11 10-16 18-16s14 5 18 16c-4 2-9 3-18 3s-14-1-18-3Z"
        fill="#c4b5fd"
      />
      <path
        d="M16 24c3-7 9-11 16-11s13 4 16 11c-4 2-9 3-16 3s-12-1-16-3Z"
        fill="#a78bfa"
      />
      <circle cx="22" cy="22" r="5" fill="#f0abfc" opacity="0.85" />
      <circle cx="42" cy="22" r="5" fill="#f0abfc" opacity="0.85" />
      <circle cx="32" cy="32" r="14" fill="#ffe4d6" />
      <circle cx="24" cy="40" r="3.2" fill="#fda4af" opacity="0.45" />
      <circle cx="40" cy="40" r="3.2" fill="#fda4af" opacity="0.45" />
      <ellipse cx="26.5" cy="31" rx="3.2" ry="3.8" fill="#1f2937" />
      <ellipse cx="37.5" cy="31" rx="3.2" ry="3.8" fill="#1f2937" />
      <circle cx="27.4" cy="29.6" r="1.2" fill="#ffffff" />
      <circle cx="38.4" cy="29.6" r="1.2" fill="#ffffff" />
      <circle cx="25.8" cy="32.2" r="0.55" fill="#ffffff" opacity="0.8" />
      <circle cx="36.8" cy="32.2" r="0.55" fill="#ffffff" opacity="0.8" />
      <path
        d="M24 38.5q8 5 16 0"
        stroke="#e879a9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M28 40.2q4 1.5 8 0"
        stroke="#f472b6"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="44" cy="18" r="2.2" fill="#f9a8d4" />
      <circle cx="44" cy="18" r="0.8" fill="#ffffff" opacity="0.9" />
    </AvatarFrame>
  );
}

export function BimaAvatar({ className }: AvatarProps) {
  return (
    <AvatarFrame className={className} bg="#1f2937">
      <ellipse cx="32" cy="58" rx="18" ry="10" fill="#0f172a" opacity="0.35" />
      <circle cx="32" cy="31" r="14" fill="#f1c9a2" />
      <path d="M18 24c2-4 7-7 14-7s12 3 14 7c-3 1-8 2-14 2s-11-1-14-2Z" fill="#374151" />
      <circle cx="27" cy="30" r="1.5" fill="#1f2937" />
      <circle cx="37" cy="30" r="1.5" fill="#1f2937" />
      <path d="M28 36h8" stroke="#9a6b43" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 20h20v6H22z" fill="#4b5563" />
    </AvatarFrame>
  );
}

export function RizkyAvatar({ className }: AvatarProps) {
  return (
    <AvatarFrame className={className} bg="#312e81">
      <ellipse cx="32" cy="58" rx="18" ry="10" fill="#1e1b4b" opacity="0.35" />
      <circle cx="32" cy="31" r="14" fill="#e8b995" />
      <path d="M17 26c2-5 8-9 15-9s13 4 15 9c-4 1-9 2-15 2s-11-1-15-2Z" fill="#4338ca" />
      <circle cx="27" cy="30" r="1.5" fill="#1f2937" />
      <circle cx="37" cy="30" r="1.5" fill="#1f2937" />
      <path d="M28 36q4 2 8 0" stroke="#9a6b43" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 18c4-3 9-4 12-4s8 1 12 4" stroke="#4A4A4A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </AvatarFrame>
  );
}

export const analyticsCreatorAvatars = [
  { name: "Karen Dorena", Avatar: KarenAvatar },
  { name: "Alya Putri", Avatar: AlyaAvatar },
  { name: "Bima Aditya", Avatar: BimaAvatar },
  { name: "Rizky Arif", Avatar: RizkyAvatar },
] as const;

export function CreatorAvatarGraphic({
  Avatar,
  className,
}: {
  Avatar: ComponentType<AvatarProps>;
  className?: string;
}) {
  return <Avatar className={className} />;
}