"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Users } from "lucide-react";
import { bulkUpdateCampaignCreatorFees } from "@/app/actions/campaigns";
import { useToast } from "@/components/ui/toast";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableElement,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
} from "@/components/ui/data-table";
import {
  formatCompactFee,
  formatCreatorCPV,
  formatCreatorListUsername,
  formatIDR,
  formatNumber,
  parseCompactFee,
} from "@/lib/utils";
import type { CampaignCreator, CampaignDetail } from "@/types/database";

type CampaignCreatorsPanelProps = {
  campaign: CampaignDetail;
};

function effectiveCampaignFee(creator: CampaignCreator) {
  return creator.campaign_fee ?? creator.fee;
}

function campaignFeeInputValue(creator: CampaignCreator) {
  const fee = effectiveCampaignFee(creator);
  return fee > 0 ? formatCompactFee(fee) : "";
}

function parseFeeInput(value: string) {
  return parseCompactFee(value);
}

function CreatorAvatar({ creator }: { creator: CampaignCreator }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kefoo-100 text-sm font-semibold text-kefoo-700">
      {creator.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function CampaignCreatorsPanel({ campaign }: CampaignCreatorsPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [bulkFeeInput, setBulkFeeInput] = useState("");
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    setFeeInputs(
      Object.fromEntries(
        campaign.creators.map((creator) => [
          creator.id,
          campaignFeeInputValue(creator),
        ]),
      ),
    );
  }, [campaign.creators]);

  const viewsByCreator = useMemo(() => {
    const map = new Map<string, number>();

    for (const video of campaign.videos) {
      map.set(
        video.creator_id,
        (map.get(video.creator_id) ?? 0) + video.views,
      );
    }

    return map;
  }, [campaign.videos]);

  const hasFeeChanges = campaign.creators.some((creator) => {
    const input = feeInputs[creator.id] ?? campaignFeeInputValue(creator);
    const parsed = input.trim() ? parseFeeInput(input) : 0;
    const prefilled = effectiveCampaignFee(creator);

    if (creator.campaign_fee != null) {
      return parsed !== creator.campaign_fee;
    }

    return parsed !== prefilled;
  });

  function applyBulkFee() {
    const fee = parseFeeInput(bulkFeeInput);

    if (!bulkFeeInput.trim() || fee < 0) {
      showError("Enter a valid fee to apply to all creators (e.g. 1.5M or 500K).");
      return;
    }

    setFeeInputs(
      Object.fromEntries(
        campaign.creators.map((creator) => [
          creator.id,
          formatCompactFee(fee),
        ]),
      ),
    );
  }

  function handleSaveFees() {
    const updates = campaign.creators.map((creator) => {
      const raw = feeInputs[creator.id] ?? campaignFeeInputValue(creator);

      if (!raw.trim()) {
        return { creator_id: creator.id, fee: null, error: null };
      }

      const fee = parseFeeInput(raw);

      if (fee < 0) {
        return { creator_id: creator.id, fee: null, error: "Invalid fee." };
      }

      return { creator_id: creator.id, fee, error: null };
    });

    for (const update of updates) {
      if (update.error) {
        const creator = campaign.creators.find(
          (item) => item.id === update.creator_id,
        );
        showError(`${creator?.name ?? "Creator"}: ${update.error}`);
        return;
      }
    }

    startSaveTransition(async () => {
      const result = await bulkUpdateCampaignCreatorFees(
        campaign.id,
        updates.map(({ creator_id, fee }) => ({ creator_id, fee })),
      );

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess(
        `Updated campaign fees for ${result.updated} creator${result.updated === 1 ? "" : "s"}.`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Creators</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Starts from each creator&apos;s default fee when unset. Campaign
            fees can be edited here without changing the Creators page.
          </p>
        </div>

        {campaign.creators.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="bulk-creator-fee" className="sr-only">
                Apply fee to all creators
              </label>
              <input
                id="bulk-creator-fee"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1.5M"
                value={bulkFeeInput}
                onChange={(event) => setBulkFeeInput(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 sm:w-40"
              />
              <button
                type="button"
                onClick={applyBulkFee}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Apply to all
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveFees}
              disabled={isSaving || !hasFeeChanges}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-kefoo-400 px-4 py-2 text-sm font-medium text-white hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save fees"}
            </button>
          </div>
        )}
      </div>

      {campaign.creators.length === 0 ? (
        <DataTable>
          <EmptyState
            title="No creators linked yet"
            description={
              campaign.videos.length > 0
                ? "Creators from linked videos will appear here automatically."
                : "Add creators in Edit campaign, or bulk upload videos to this campaign."
            }
          />
        </DataTable>
      ) : (
        <DataTable>
          <DataTableElement>
            <DataTableHead>
              <DataTableHeaderCell>Creator</DataTableHeaderCell>
              <DataTableHeaderCell>Profile</DataTableHeaderCell>
              <DataTableHeaderCell>Platform</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">
                Campaign views
              </DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">
                Campaign fee
              </DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">CPV</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {campaign.creators.map((creator) => {
                const campaignViews = viewsByCreator.get(creator.id) ?? 0;
                const feeInput =
                  feeInputs[creator.id] ?? campaignFeeInputValue(creator);
                const parsedFee = feeInput.trim()
                  ? parseFeeInput(feeInput)
                  : null;
                const displayFee = parsedFee ?? effectiveCampaignFee(creator);

                return (
                  <DataTableRow key={creator.id}>
                    <DataTableCell>
                      <div className="flex items-center gap-3">
                        <CreatorAvatar creator={creator} />
                        <Link
                          href={`/creators/${creator.id}`}
                          className="font-medium text-kefoo-600 hover:text-kefoo-500"
                        >
                          {creator.name}
                        </Link>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">
                      {formatCreatorListUsername(creator)}
                    </DataTableCell>
                    <DataTableCell>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {creator.platform}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="text-right text-slate-600">
                      {formatNumber(campaignViews)}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={feeInput}
                        placeholder="e.g. 500K"
                        onChange={(event) =>
                          setFeeInputs((current) => ({
                            ...current,
                            [creator.id]: event.target.value,
                          }))
                        }
                        aria-label={`Campaign fee for ${creator.name}`}
                        className="w-full min-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-right text-sm text-slate-900 outline-none focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20"
                      />
                      {creator.campaign_fee != null &&
                      feeInput !== campaignFeeInputValue(creator) ? (
                        <p className="mt-1 text-xs text-slate-400">
                          Was {formatIDR(creator.campaign_fee)}
                        </p>
                      ) : creator.campaign_fee == null && creator.fee > 0 ? (
                        <p className="mt-1 text-xs text-slate-400">
                          From creator default
                        </p>
                      ) : null}
                    </DataTableCell>
                    <DataTableCell className="text-right text-slate-600">
                      {displayFee > 0
                        ? formatCreatorCPV(displayFee, campaignViews)
                        : "—"}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTableElement>
        </DataTable>
      )}
    </section>
  );
}
