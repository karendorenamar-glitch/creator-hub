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
      className={cn("shrink-0 overflow-hidden rounded-full ring-2 ring-[#070b16]", className)}
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
        fill="#6d28d9"
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
    <AvatarFrame className={className} bg="#1e3a5f">
      <ellipse cx="32" cy="58" rx="18" ry="10" fill="#0f172a" opacity="0.35" />
      <path
        d="M14 36c3-11 11-17 18-17s15 6 18 17c-5 2-10 3-18 3s-13-1-18-3Z"
        fill="#0c4a6e"
      />
      <circle cx="32" cy="31" r="13" fill="#f5d0b5" />
      <circle cx="27" cy="30" r="1.5" fill="#3f2a1d" />
      <circle cx="37" cy="30" r="1.5" fill="#3f2a1d" />
      <path d="M28 36q4 2 8 0" stroke="#b77957" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 22c3-5 8-8 14-8s11 3 14 8c-4 3-9 5-14 5s-10-2-14-5Z" fill="#075985" />
      <path d="M22 18h20v8c0 0-4 6-10 6s-10-6-10-6V18Z" fill="#0284c7" opacity="0.55" />
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
      <path d="M20 18c4-3 9-4 12-4s8 1 12 4" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round" />
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
