"use client";

import { getCampaignNameById } from "@/lib/campaigns";
import {
  formatCreatorNames,
  formatPlannedDate,
  getContentPlannerStatusStyle,
  getCreatorNamesList,
  getInspirationUrl,
} from "@/lib/content-planner";
import { Drawer, DrawerField } from "@/components/ui/drawer";
import type { CampaignOption, ContentPlannerAgency } from "@/types/database";

type ContentPlannerDetailDrawerProps = {
  item: ContentPlannerAgency | null;
  open: boolean;
  onClose: () => void;
  campaigns: CampaignOption[];
};

function displayText(value: string) {
  return value.trim() || "—";
}

export function ContentPlannerDetailDrawer({
  item,
  open,
  onClose,
  campaigns,
}: ContentPlannerDetailDrawerProps) {
  if (!item) return null;

  const creators = getCreatorNamesList(item.creator_names);
  const inspirationUrl = getInspirationUrl(item.inspiration_url);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Content Details"
      description="View the full content plan."
    >
      <div className="space-y-6">
        <DrawerField label="Content Pillar">
          <p className="font-medium">{displayText(item.content_pillar)}</p>
        </DrawerField>

        <DrawerField label="Campaign">
          <p>{getCampaignNameById(item.campaign_id, campaigns)}</p>
        </DrawerField>

        <DrawerField label="Content Idea / SOW">
          <p className="whitespace-pre-wrap text-slate-700">
            {displayText(item.content_idea)}
          </p>
        </DrawerField>

        <DrawerField label="Hook">
          <p className="whitespace-pre-wrap text-slate-700">
            {displayText(item.hook)}
          </p>
        </DrawerField>

        <DrawerField label="Reference / Inspiration">
          {inspirationUrl ? (
            <a
              href={inspirationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-medium text-indigo-600 hover:text-indigo-500"
            >
              {inspirationUrl}
            </a>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </DrawerField>

        <DrawerField label="Creators">
          {creators.length === 0 ? (
            <p className="text-slate-500">—</p>
          ) : creators.length === 1 ? (
            <p>{formatCreatorNames(creators)}</p>
          ) : (
            <ul className="space-y-1.5">
              {creators.map((name) => (
                <li key={name} className="text-slate-700">
                  👤 {name}
                </li>
              ))}
            </ul>
          )}
        </DrawerField>

        <DrawerField label="Platform">
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {displayText(item.platform)}
          </span>
        </DrawerField>

        <DrawerField label="Date">
          <p>{formatPlannedDate(item.planned_date)}</p>
        </DrawerField>

        <DrawerField label="Status">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getContentPlannerStatusStyle(item.status)}`}
          >
            {displayText(item.status)}
          </span>
        </DrawerField>
      </div>
    </Drawer>
  );
}
