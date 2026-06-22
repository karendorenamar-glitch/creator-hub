"use client";

import { useState } from "react";
import Link from "next/link";
import { ContentPlannerCalendar } from "@/components/planner/content-planner-calendar";
import { ContentPlannerDetailDrawer } from "@/components/planner/content-planner-detail-drawer";
import {
  formatCreatorNames,
  formatPlannedDate,
  getContentPlannerStatusStyle,
} from "@/lib/content-planner";
import type { CampaignOption, ContentPlannerAgency } from "@/types/database";

type CampaignPlannerPanelProps = {
  items: ContentPlannerAgency[];
  campaigns: CampaignOption[];
};

export function CampaignPlannerPanel({
  items,
  campaigns,
}: CampaignPlannerPanelProps) {
  const [selectedItem, setSelectedItem] = useState<ContentPlannerAgency | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDetails(item: ContentPlannerAgency) {
    setSelectedItem(item);
    setDrawerOpen(true);
  }

  return (
    <>
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Linked Content Ideas
            </h3>
            <p className="text-sm text-slate-500">
              Content planner items assigned to this campaign.
            </p>
          </div>
          <Link
            href="/planner"
            className="text-sm font-medium text-kefoo-600 hover:text-kefoo-500"
          >
            Open Content Planner
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No content ideas linked yet. Assign this campaign when creating
            content in the planner.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Content Idea</th>
                  <th className="px-3 py-2">Creators</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openDetails(item)}
                        className="max-w-xs text-left font-medium text-kefoo-600 hover:text-kefoo-500"
                      >
                        {item.content_idea}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.content_pillar}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatCreatorNames(item.creator_names)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatPlannedDate(item.planned_date)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getContentPlannerStatusStyle(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Planned Content Calendar
          </h3>
          <p className="text-sm text-slate-500">
            Scheduled content ideas for this campaign.
          </p>
        </div>
        <ContentPlannerCalendar
          items={items}
          onViewDetails={openDetails}
          onAddContent={() => {}}
          hideAddButton
        />
      </section>

      <ContentPlannerDetailDrawer
        item={selectedItem}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        campaigns={campaigns}
      />
    </>
  );
}
