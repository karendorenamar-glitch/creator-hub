import { ContentPlannerShell } from "@/components/planner/content-planner-shell";
import {
  getCampaignOptions,
  getContentPlannerItems,
  getCreators,
} from "@/lib/data";

export default async function ContentPlannerPage() {
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
