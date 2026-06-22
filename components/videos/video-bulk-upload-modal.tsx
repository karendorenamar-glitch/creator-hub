"use client";

import { useEffect, useMemo, useState } from "react";
import { createVideoFromUrl } from "@/app/actions/videos";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { parseTikTokVideoUrls } from "@/lib/tiktok-url";
import type { CampaignOption } from "@/types/database";

const PLATFORMS = ["TikTok", "Instagram", "Threads", "YouTube", "Twitch", "Other"];

type VideoBulkUploadModalProps = {
  open: boolean;
  onClose: () => void;
  campaigns: CampaignOption[];
};

type UploadFailure = {
  url: string;
  error: string;
};

const textareaClassName =
  "min-h-[220px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500";

export function VideoBulkUploadModal({
  open,
  onClose,
  campaigns,
}: VideoBulkUploadModalProps) {
  const { showSuccess, showError } = useToast();
  const [campaignId, setCampaignId] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [linksText, setLinksText] = useState("");
  const [importMetrics, setImportMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [createdCreatorsCount, setCreatedCreatorsCount] = useState(0);

  useEffect(() => {
    if (!open) return;

    setCampaignId(campaigns[0]?.id ?? "");
    setPlatform("TikTok");
    setLinksText("");
    setImportMetrics(true);
    setError(null);
    setIsUploading(false);
    setProgress({ current: 0, total: 0 });
    setFailures([]);
    setAddedCount(0);
    setCreatedCreatorsCount(0);
  }, [open, campaigns]);

  const parsedLinks = useMemo(
    () => parseTikTokVideoUrls(linksText),
    [linksText],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFailures([]);
    setAddedCount(0);
    setCreatedCreatorsCount(0);

    if (!campaignId) {
      setError("Select a campaign for these uploads.");
      return;
    }

    if (parsedLinks.valid.length === 0) {
      setError("Add at least one valid TikTok video link.");
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: parsedLinks.valid.length });

    const failed: UploadFailure[] = [];
    let added = 0;
    let newCreators = 0;

    try {
      for (let index = 0; index < parsedLinks.valid.length; index += 1) {
        const url = parsedLinks.valid[index];
        setProgress({ current: index + 1, total: parsedLinks.valid.length });

        const result = await createVideoFromUrl({
          video_url: url,
          platform,
          campaign_id: campaignId,
          import_metrics: importMetrics,
          auto_create_creator: true,
          revalidate: index === parsedLinks.valid.length - 1,
        });

        if (result.error) {
          failed.push({ url, error: result.error });
        } else {
          added += 1;
          if ("createdCreator" in result && result.createdCreator) {
            newCreators += 1;
          }
        }
      }
    } finally {
      setIsUploading(false);
      setFailures(failed);
      setAddedCount(added);
      setCreatedCreatorsCount(newCreators);
    }

    if (added === 0) {
      showError("No videos were added. Check the errors below.");
      return;
    }

    const creatorNote =
      newCreators > 0
        ? ` ${newCreators} new creator${newCreators === 1 ? "" : "s"} added.`
        : "";

    if (failed.length > 0) {
      showSuccess(`Added ${added} videos.${creatorNote} ${failed.length} failed.`);
      return;
    }

    showSuccess(
      added === 1
        ? `1 video added.${creatorNote}`
        : `${added} videos added successfully.${creatorNote}`,
    );
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Upload Videos"
      description="Paste TikTok links, one per line. Videos and creators are linked to the selected campaign automatically."
      loading={isUploading}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Campaign" htmlFor="bulk-video-campaign">
          <select
            id="bulk-video-campaign"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className={inputClassName}
            required
            disabled={isUploading || campaigns.length === 0}
          >
            {campaigns.length === 0 ? (
              <option value="">No campaigns available</option>
            ) : (
              campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))
            )}
          </select>
        </FormField>

        <FormField label="Platform" htmlFor="bulk-video-platform">
          <select
            id="bulk-video-platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className={inputClassName}
            disabled={isUploading}
          >
            {PLATFORMS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="TikTok Video Links" htmlFor="bulk-video-links">
          <textarea
            id="bulk-video-links"
            value={linksText}
            onChange={(event) => setLinksText(event.target.value)}
            className={textareaClassName}
            placeholder={
              "https://www.tiktok.com/@karendorena/video/1234567890\nhttps://www.tiktok.com/@newcreator/video/9876543210"
            }
            disabled={isUploading}
          />
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={importMetrics}
              onChange={(event) => setImportMetrics(event.target.checked)}
              disabled={isUploading}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Import metrics from TikTok
          </label>

          <p>
            {parsedLinks.valid.length} valid link
            {parsedLinks.valid.length === 1 ? "" : "s"}
            {parsedLinks.invalid.length > 0
              ? ` · ${parsedLinks.invalid.length} invalid`
              : ""}
          </p>
        </div>

        {isUploading ? (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            Uploading {progress.current} of {progress.total}...
          </div>
        ) : null}

        {parsedLinks.invalid.length > 0 && !isUploading ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Skipped invalid lines</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {parsedLinks.invalid.slice(0, 5).map((line) => (
                <li key={line} className="break-all font-mono text-xs">
                  {line}
                </li>
              ))}
            </ul>
            {parsedLinks.invalid.length > 5 ? (
              <p className="mt-2 text-xs">
                +{parsedLinks.invalid.length - 5} more
              </p>
            ) : null}
          </div>
        ) : null}

        {failures.length > 0 && !isUploading ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-medium">
              {addedCount} added, {failures.length} failed
            </p>
            <ul className="mt-2 space-y-2">
              {failures.slice(0, 5).map((failure) => (
                <li key={failure.url}>
                  <p className="break-all font-mono text-xs">{failure.url}</p>
                  <p className="text-xs text-red-700">{failure.error}</p>
                </li>
              ))}
            </ul>
            {failures.length > 5 ? (
              <p className="mt-2 text-xs">+{failures.length - 5} more</p>
            ) : null}
          </div>
        ) : null}

        {error ? <FormError message={error} /> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {addedCount > 0 && failures.length > 0 ? "Close" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isUploading || campaigns.length === 0 || parsedLinks.valid.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isUploading
              ? `Uploading (${progress.current}/${progress.total})...`
              : `Upload ${parsedLinks.valid.length || ""} Video${parsedLinks.valid.length === 1 ? "" : "s"}`.trim()}
          </button>
        </div>
      </form>
    </Modal>
  );
}
