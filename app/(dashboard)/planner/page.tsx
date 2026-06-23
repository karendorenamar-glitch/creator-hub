import { redirect } from "next/navigation";
import { ContentPlannerShell } from "@/components/planner/content-planner-shell";
import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import {
  getCampaignOptions,
  getContentPlannerItems,
  getCreators,
} from "@/lib/data";

export default async function ContentPlannerPage() {
  if (!CONTENT_PLANNER_ENABLED) {
    redirect("/campaigns");
  }

  const [items, campaigns, creators] = await Promise.all([
    getContentPlannerItems(),
    getCampaignOptions(),
    getCreators(),
  ]);

  return (
    <ContentPlannerShell
      items={items}
      campaigns={campaigns}
      creators={creators}
    />
  );
}
