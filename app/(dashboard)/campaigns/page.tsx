import { Header } from "@/components/layout/header";
import { CampaignsSection } from "@/components/campaigns/campaigns-section";
import {
  getCampaignSummaries,
  getCreators,
  getVideos,
} from "@/lib/data";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";
import { resolveResourceScopeFilter } from "@/lib/team-filter";

export default async function CampaignsPage() {
  const locale = await getLocale();
  const membership = await getOrgMembershipForAction();

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  const resourceScope = resolveResourceScopeFilter(
    membership.role,
    membership.userId,
    "all",
  );

  const [campaigns, creators, videos] = await Promise.all([
    getCampaignSummaries("all"),
    getCreators(undefined, resourceScope),
    getVideos(resourceScope),
  ]);

  return (
    <>
      <Header
        title={getMessage(locale, "pages.campaigns.title")}
        description={getMessage(locale, "pages.campaigns.descriptionShort")}
      />

      <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CampaignsSection
          campaigns={campaigns}
          creators={creators}
          videos={videos}
          currentUserId={membership.userId}
          memberRole={membership.role}
        />
      </main>
    </>
  );
}
