"use client";

import dynamic from "next/dynamic";

const StudioEditor = dynamic(
  () =>
    import("@/components/invitation-studio/studio-editor").then(
      (module) => ({ default: module.StudioEditor }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#e9e5dd] text-sm text-cocoa/60">
        Menyiapkan invitation studio…
      </div>
    ),
  },
);

export function StudioClient() {
  return <StudioEditor />;
}
