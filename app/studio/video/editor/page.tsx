import { STUDIO_FONT_STYLESHEET } from "@/lib/invitation-studio/fonts";
import { VideoEditor } from "@/components/video-studio/video-editor";

export const metadata = {
  title: "Video Invitation Editor | Kefoo",
};

type EditorPageProps = {
  searchParams: Promise<{ template?: string; draft?: string }>;
};

export default async function VideoEditorPage({ searchParams }: EditorPageProps) {
  const params = await searchParams;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={STUDIO_FONT_STYLESHEET} />
      <VideoEditor initialTemplateId={params.template} initialDraftId={params.draft} />
    </>
  );
}
