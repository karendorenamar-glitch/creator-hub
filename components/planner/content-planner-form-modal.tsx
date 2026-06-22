"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createContentPlannerItem,
  updateContentPlannerItem,
} from "@/app/actions/content-planner";
import {
  CONTENT_PLANNER_PLATFORMS,
  CONTENT_PLANNER_STATUSES,
  getCreatorNamesFromIds,
  getCreatorNamesList,
  getSelectedCreatorIds,
  type ContentPlannerInput,
  type ContentPlannerPlatform,
  type ContentPlannerStatus,
} from "@/lib/content-planner";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { CampaignOption, ContentPlannerAgency, Creator } from "@/types/database";

type ContentPlannerFormModalProps = {
  open: boolean;
  onClose: () => void;
  item?: ContentPlannerAgency | null;
  defaultPlannedDate?: string;
  campaigns?: CampaignOption[];
  creators: Creator[];
};

const emptyForm: ContentPlannerInput = {
  content_pillar: "",
  content_idea: "",
  hook: "",
  creator_names: [],
  campaign_id: "",
  inspiration_url: "",
  planned_date: "",
  platform: "TikTok",
  status: "Idea",
};

export function ContentPlannerFormModal({
  open,
  onClose,
  item,
  defaultPlannedDate = "",
  campaigns = [],
  creators,
}: ContentPlannerFormModalProps) {
  const isEditing = Boolean(item);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<ContentPlannerInput>(emptyForm);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setError(null);

    if (item) {
      setForm({
        content_pillar: item.content_pillar,
        content_idea: item.content_idea,
        hook: item.hook,
        creator_names: getCreatorNamesList(item.creator_names),
        campaign_id: item.campaign_id ?? "",
        inspiration_url: item.inspiration_url ?? "",
        planned_date: item.planned_date ?? "",
        platform: item.platform as ContentPlannerPlatform,
        status: item.status as ContentPlannerStatus,
      });
      setSelectedCreatorIds(getSelectedCreatorIds(creators, item.creator_names));
      return;
    }

    setForm({
      ...emptyForm,
      planned_date: defaultPlannedDate,
    });
    setSelectedCreatorIds([]);
  }, [open, item, creators, defaultPlannedDate]);

  function handleChange<K extends keyof ContentPlannerInput>(
    field: K,
    value: ContentPlannerInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCreator(creatorId: string) {
    setSelectedCreatorIds((current) =>
      current.includes(creatorId)
        ? current.filter((id) => id !== creatorId)
        : [...current, creatorId],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.content_pillar.trim()) {
      setError("Content pillar is required.");
      return;
    }

    if (!form.content_idea.trim()) {
      setError("Content idea / SOW is required.");
      return;
    }

    const payload: ContentPlannerInput = {
      ...form,
      creator_names: getCreatorNamesFromIds(creators, selectedCreatorIds),
    };

    startTransition(async () => {
      const result = item
        ? await updateContentPlannerItem(item.id, payload)
        : await createContentPlannerItem(payload);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess(
        isEditing
          ? "Content updated successfully."
          : "Content idea created successfully.",
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Content" : "New Content"}
      description={
        isEditing
          ? "Update content details and save changes."
          : "Add a content idea to your planner."
      }
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Content Pillar" htmlFor="content-pillar">
          <input
            id="content-pillar"
            name="content_pillar"
            value={form.content_pillar}
            onChange={(event) =>
              handleChange("content_pillar", event.target.value)
            }
            className={inputClassName}
            placeholder="e.g. Education, Entertainment, Product"
            required
          />
        </FormField>

        <FormField label="Campaign" htmlFor="content-campaign">
          <select
            id="content-campaign"
            name="campaign_id"
            value={form.campaign_id}
            onChange={(event) =>
              handleChange("campaign_id", event.target.value)
            }
            className={inputClassName}
          >
            <option value="">No Campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Content Idea / SOW" htmlFor="content-idea">
          <textarea
            id="content-idea"
            name="content_idea"
            value={form.content_idea}
            onChange={(event) =>
              handleChange("content_idea", event.target.value)
            }
            className={`${inputClassName} min-h-24 resize-y`}
            placeholder="Describe the content idea or statement of work"
            rows={4}
            required
          />
        </FormField>

        <FormField label="Hook" htmlFor="content-hook">
          <input
            id="content-hook"
            name="hook"
            value={form.hook}
            onChange={(event) => handleChange("hook", event.target.value)}
            className={inputClassName}
            placeholder="Opening line or attention grabber"
          />
        </FormField>

        <FormField
          label="Reference / Inspiration"
          htmlFor="content-inspiration"
        >
          <input
            id="content-inspiration"
            name="inspiration_url"
            type="text"
            inputMode="url"
            value={form.inspiration_url}
            onChange={(event) =>
              handleChange("inspiration_url", event.target.value)
            }
            className={inputClassName}
            placeholder="https://www.tiktok.com/... or any reference link"
          />
        </FormField>

        <FormField label="Creators" htmlFor="content-creators">
          <div
            id="content-creators"
            className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3"
          >
            {creators.length === 0 ? (
              <p className="text-sm text-slate-500">No creators available.</p>
            ) : (
              creators.map((creator) => (
                <label
                  key={creator.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCreatorIds.includes(creator.id)}
                    onChange={() => toggleCreator(creator.id)}
                    className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">
                    {creator.name} · {creator.platform}
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>

        <FormField label="Platform" htmlFor="content-platform">
          <select
            id="content-platform"
            name="platform"
            value={form.platform}
            onChange={(event) =>
              handleChange(
                "platform",
                event.target.value as ContentPlannerInput["platform"],
              )
            }
            className={inputClassName}
          >
            {CONTENT_PLANNER_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Status" htmlFor="content-status">
          <select
            id="content-status"
            name="status"
            value={form.status}
            onChange={(event) =>
              handleChange(
                "status",
                event.target.value as ContentPlannerInput["status"],
              )
            }
            className={inputClassName}
          >
            {CONTENT_PLANNER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Date" htmlFor="content-planned-date">
          <input
            id="content-planned-date"
            name="planned_date"
            type="date"
            value={form.planned_date}
            onChange={(event) =>
              handleChange("planned_date", event.target.value)
            }
            className={inputClassName}
          />
        </FormField>

        {error && <FormError message={error} />}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-kefoo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-500 disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Content"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
