import { STUDIO_FONT_STYLESHEET } from "@/lib/invitation-studio/fonts";
import { VideoGallery } from "@/components/video-studio/video-gallery";

export const metadata = {
  title: "Kefoo Video Invitations",
  description: "Create a cinematic 9:16 wedding invitation video.",
};

export default function VideoStudioPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={STUDIO_FONT_STYLESHEET} />
      <VideoGallery />
    </>
  );
}
