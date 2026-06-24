import { redirect } from "next/navigation";
import { ContentPlannerShell } from "@/components/planner/content-planner-shell";
import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import {
  getCampaignOptions,
  getContentPlannerItems,
  getCreators,
} from "@/lib/data";
import { getOrgMembershipForAction } from "@/lib/org";
import { resolveResourceScopeFilter } from "@/lib/team-filter";

export default async function ContentPlannerPage() {
  if (!CONTENT_PLANNER_ENABLED) {
    redirect("/campaigns");
  }

  const membership = await getOrgMembershipForAction();

  if ("error" in membership) {
    throw new Error(membership.error);
  }

  const resourceScope = resolveResourceScopeFilter(
    membership.role,
    membership.userId,
    "all",
  );

  const [items, campaigns, creators] = await Promise.all([
    getContentPlannerItems(),
    getCampaignOptions(),
    getCreators(undefined, resourceScope),
  ]);

  return (
    <ContentPlannerShell
      items={items}
      campaigns={campaigns}
      creators={creators}
    />
  );
}
