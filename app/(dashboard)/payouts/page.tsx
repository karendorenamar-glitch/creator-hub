import { Header } from "@/components/layout/header";
import { PayoutsSection } from "@/components/payouts/payouts-section";
import {
  getCampaignOptions,
  getCreators,
  getPayouts,
} from "@/lib/data";
import { getOrgMembershipForAction } from "@/lib/org";
import { getLocale } from "@/lib/i18n/get-locale";
import { getMessage } from "@/lib/i18n/messages";
import { resolveResourceScopeFilter } from "@/lib/team-filter";

export default async function PayoutsPage() {
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

  const [payouts, creators, campaigns] = await Promise.all([
    getPayouts(),
    getCreators(undefined, resourceScope),
    getCampaignOptions(),
  ]);

  return (
    <>
      <Header
        title={getMessage(locale, "pages.payouts.title")}
        description={getMessage(locale, "pages.payouts.description")}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <PayoutsSection
          payouts={payouts}
          creators={creators}
          campaigns={campaigns}
        />
      </main>
    </>
  );
}
