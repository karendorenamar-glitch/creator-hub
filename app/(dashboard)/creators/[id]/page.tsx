import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { CreatorDetailSection } from "@/components/creators/creator-detail-section";
import { getCreatorById } from "@/lib/data";

type CreatorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const creator = await getCreatorById(id);

  if (!creator) {
    notFound();
  }

  return (
    <>
      <Header
        title="Creator Details"
        description="Review creator performance, videos, and campaign participation."
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CreatorDetailSection creator={creator} />
      </main>
    </>
  );
}
