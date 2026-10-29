import { StudioClient } from "./studio-client";
import { STUDIO_FONT_STYLESHEET } from "@/lib/invitation-studio/fonts";

export const metadata = {
  title: "Kefoo E-Invitation Studio",
  description: "Local invitation design studio.",
};

export default function StudioPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={STUDIO_FONT_STYLESHEET} />
      <StudioClient />
    </>
  );
}
