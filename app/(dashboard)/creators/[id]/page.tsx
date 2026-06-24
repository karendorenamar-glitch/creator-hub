import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { CreatorDetailSection } from "@/components/creators/creator-detail-section";
import { getOrgMembershipForAction } from "@/lib/org";
import { getCreatorById } from "@/lib/data";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";

type CreatorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const membership = await getOrgMembershipForAction();

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  const createdByFilter =
    membership.role === "team" ? membership.userId : undefined;
  const creator = await getCreatorById(id, createdByFilter);

  if (!creator) {
    notFound();
  }

  return (
    <>
      <Header
        title={getMessage(locale, "pages.creatorDetails.title")}
        description={getMessage(locale, "pages.creatorDetails.description")}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <CreatorDetailSection creator={creator} />
      </main>
    </>
  );
}
