"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { createVideoFromUrl, revalidateAfterBulkUpload } from "@/app/actions/videos";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { runWithConcurrency } from "@/lib/async-pool";
import {
  detectVideoPlatform,
  parseVideoUrls,
  parseVideoUrlsForPlatform,
  VIDEO_PLATFORMS,
  type VideoPlatform,
} from "@/lib/video-url";
import type { CampaignOption } from "@/types/database";

const BULK_UPLOAD_FORM_ID = "bulk-upload-videos-form";
const MAX_BULK_VIDEOS = 100;
/** Apify scrapes run in parallel (up to this many at once). */
const BULK_UPLOAD_CONCURRENCY = 5;

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
  "min-h-[220px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kefoo-500 focus:ring-2 focus:ring-kefoo-500/20 disabled:bg-slate-50 disabled:text-slate-500";

const PLATFORM_PLACEHOLDERS: Record<VideoPlatform, string> = {
  TikTok:
    "https://www.tiktok.com/@creator/video/1234567890\nhttps://www.tiktok.com/@creator/video/9876543210",
  Instagram:
    "https://www.instagram.com/reel/ABC123/\nhttps://www.instagram.com/p/XYZ789/",
};

export function VideoBulkUploadModal({
  open,
  onClose,
  campaigns,
}: VideoBulkUploadModalProps) {
  const { showSuccess, showError } = useToast();
  const [campaignId, setCampaignId] = useState("");
  const [platform, setPlatform] = useState<VideoPlatform>("TikTok");
  const [linksText, setLinksText] = useState("");
  const [importMetrics, setImportMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failures, setFailures] = useState<UploadFailure[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [createdCreatorsCount, setCreatedCreatorsCount] = useState(0);
  const previousLinksText = useRef("");

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
    previousLinksText.current = "";
  }, [open, campaigns]);

  useEffect(() => {
    if (!open || isUploading || linksText === previousLinksText.current) {
      return;
    }

    previousLinksText.current = linksText;

    if (!linksText.trim()) {
      return;
    }

    const forCurrentPlatform = parseVideoUrlsForPlatform(linksText, platform);
    if (forCurrentPlatform.valid.length > 0) {
      return;
    }

    const allLinks = parseVideoUrls(linksText);
    if (allLinks.valid.length === 0) {
      return;
    }

    const detectedPlatforms = new Set(
      allLinks.valid
        .map((url) => detectVideoPlatform(url))
        .filter((value): value is VideoPlatform => value !== null),
    );

    if (detectedPlatforms.size === 1) {
      const [detectedPlatform] = detectedPlatforms;
      if (detectedPlatform && detectedPlatform !== platform) {
        setPlatform(detectedPlatform);
      }
    }
  }, [linksText, open, isUploading, platform]);

  const parsedLinks = useMemo(
    () => parseVideoUrlsForPlatform(linksText, platform),
    [linksText, platform],
  );

  const validLinkCount = parsedLinks.valid.length;
  const wrongPlatformCount = parsedLinks.wrongPlatform.length;
  const exceedsLimit = validLinkCount > MAX_BULK_VIDEOS;
  const otherPlatform =
    platform === "TikTok" ? ("Instagram" as const) : ("TikTok" as const);

  const submitBlockedReason = isUploading
    ? null
    : campaigns.length === 0
      ? "Create a campaign first, then bulk upload videos to it."
      : validLinkCount === 0 && linksText.trim()
        ? parsedLinks.invalid.length > 0 || wrongPlatformCount > 0
          ? `No valid ${platform} links found. Check the platform or link format.`
          : `Add at least one valid ${platform} video link.`
        : exceedsLimit
          ? `Remove ${validLinkCount - MAX_BULK_VIDEOS} link${validLinkCount - MAX_BULK_VIDEOS === 1 ? "" : "s"} to stay within the ${MAX_BULK_VIDEOS}-video batch limit.`
          : null;

  const canSubmit =
    !isUploading &&
    campaigns.length > 0 &&
    validLinkCount > 0 &&
    !exceedsLimit;

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

    if (validLinkCount === 0) {
      setError(`Add at least one valid ${platform} video link.`);
      return;
    }

    if (exceedsLimit) {
      setError(
        `You can upload up to ${MAX_BULK_VIDEOS} videos at a time. Remove ${validLinkCount - MAX_BULK_VIDEOS} link${validLinkCount - MAX_BULK_VIDEOS === 1 ? "" : "s"} and run another batch for the rest.`,
      );
      return;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: validLinkCount });

    const failed: UploadFailure[] = [];
    let added = 0;
    let newCreators = 0;
    const urls = parsedLinks.valid;

    try {
      const results = await runWithConcurrency(
        urls,
        BULK_UPLOAD_CONCURRENCY,
        async (url) =>
          createVideoFromUrl({
            video_url: url,
            platform,
            campaign_id: campaignId,
            import_metrics: importMetrics,
            auto_create_creator: true,
            revalidate: false,
            from_bulk_upload: true,
          }),
        (completed, total) => {
          setProgress({ current: completed, total });
        },
      );

      for (let index = 0; index < results.length; index += 1) {
        const url = urls[index];
        const result = results[index];

        if (result.error) {
          failed.push({ url, error: result.error });
        } else {
          added += 1;
          if ("createdCreator" in result && result.createdCreator) {
            newCreators += 1;
          }
        }
      }

      if (added > 0) {
        await revalidateAfterBulkUpload(campaignId);
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
      description={`Paste ${platform} links only, one per line (up to ${MAX_BULK_VIDEOS} per batch). Switch platform for a different batch.`}
      size="xl"
      footer={
        <div className="space-y-3">
          {submitBlockedReason && !isUploading ? (
            <p className="text-sm text-amber-800">{submitBlockedReason}</p>
          ) : null}
          <div className="flex justify-end gap-3">
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
              form={BULK_UPLOAD_FORM_ID}
              disabled={!canSubmit}
              className="rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading
                ? `Saving (${progress.current}/${progress.total})...`
                : validLinkCount > 0
                  ? `Save ${validLinkCount} video${validLinkCount === 1 ? "" : "s"}`
                  : "Save videos"}
            </button>
          </div>
        </div>
      }
    >
      <form
        id={BULK_UPLOAD_FORM_ID}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div
          role="alert"
          className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3.5 text-amber-950"
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-amber-600"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-base font-bold tracking-tight">
                Keep this browser tab open until the upload finishes.
              </p>
              <p className="text-sm font-medium text-amber-900">
                Closing the tab, switching apps, or putting your laptop to sleep
                will stop the import. Videos already added are saved — the rest
                will not upload.
              </p>
            </div>
          </div>
        </div>

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
            onChange={(event) =>
              setPlatform(event.target.value as VideoPlatform)
            }
            className={inputClassName}
            disabled={isUploading}
          >
            {VIDEO_PLATFORMS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={`${platform} Video Links`} htmlFor="bulk-video-links">
          <textarea
            id="bulk-video-links"
            value={linksText}
            onChange={(event) => setLinksText(event.target.value)}
            className={textareaClassName}
            placeholder={PLATFORM_PLACEHOLDERS[platform]}
            disabled={isUploading}
          />
        </FormField>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="font-medium">Up to {MAX_BULK_VIDEOS} videos per batch.</span>{" "}
            Imports run {BULK_UPLOAD_CONCURRENCY} at a time — a full batch usually
            takes around 5–10 minutes with metrics on. Run another batch if you
            have more links.
          </p>
        </div>

        {exceedsLimit && !isUploading ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">
              Too many links ({validLinkCount}/{MAX_BULK_VIDEOS})
            </p>
            <p className="mt-1">
              Remove {validLinkCount - MAX_BULK_VIDEOS} link
              {validLinkCount - MAX_BULK_VIDEOS === 1 ? "" : "s"} to continue,
              then upload the rest in a separate batch.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={importMetrics}
              onChange={(event) => setImportMetrics(event.target.checked)}
              disabled={isUploading}
              className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
            />
            Import metrics from {platform}
          </label>

          <p>
            {validLinkCount} valid {platform} link
            {validLinkCount === 1 ? "" : "s"}
            {validLinkCount > 0 ? ` · max ${MAX_BULK_VIDEOS} per batch` : ""}
            {parsedLinks.invalid.length > 0
              ? ` · ${parsedLinks.invalid.length} invalid`
              : ""}
            {wrongPlatformCount > 0
              ? ` · ${wrongPlatformCount} ${otherPlatform}`
              : ""}
          </p>
        </div>

        {wrongPlatformCount > 0 && !isUploading ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">
              Skipped {otherPlatform} links ({wrongPlatformCount})
            </p>
            <p className="mt-1">
              This batch is set to {platform}. Switch platform or remove{" "}
              {otherPlatform} links.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {parsedLinks.wrongPlatform.slice(0, 5).map((line) => (
                <li key={line} className="break-all font-mono text-xs">
                  {line}
                </li>
              ))}
            </ul>
            {wrongPlatformCount > 5 ? (
              <p className="mt-2 text-xs">+{wrongPlatformCount - 5} more</p>
            ) : null}
          </div>
        ) : null}

        {isUploading ? (
          <div className="space-y-3">
            <div
              role="status"
              className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-amber-950"
            >
              <p className="text-base font-bold">
                Do not close this tab — upload in progress.
              </p>
            </div>
            <div className="rounded-lg border border-kefoo-100 bg-kefoo-50 px-4 py-3 text-sm text-kefoo-900">
              Uploading {progress.current} of {progress.total}...
            </div>
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
      </form>
    </Modal>
  );
}
