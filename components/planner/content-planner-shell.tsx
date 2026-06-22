"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ContentPlannerSection } from "@/components/planner/content-planner-section";
import { ContentPlannerViewToggle } from "@/components/planner/content-planner-view-toggle";
import type { ContentPlannerView } from "@/lib/content-planner";
import type { CampaignOption, ContentPlannerAgency, Creator } from "@/types/database";

type ContentPlannerShellProps = {
  items: ContentPlannerAgency[];
  campaigns: CampaignOption[];
  creators: Creator[];
};

export function ContentPlannerShell({
  items,
  campaigns,
  creators,
}: ContentPlannerShellProps) {
  const [view, setView] = useState<ContentPlannerView>("calendar");

  return (
    <>
      <Header
        title="Content Planner"
        description="Plan, organize, and track content ideas across campaigns."
        titleAddon={
          <ContentPlannerViewToggle view={view} onChange={setView} />
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <ContentPlannerSection
          view={view}
          items={items}
          campaigns={campaigns}
          creators={creators}
        />
      </main>
    </>
  );
}
