"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createCreator,
  updateCreator,
  type CreatorInput,
} from "@/app/actions/creators";
import {
  FormError,
  FormField,
  inputClassName,
  Modal,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  getCreatorDisplayUsername,
  MIN_CREATOR_FEE,
  validateCreatorFee,
} from "@/lib/utils";
import type { CampaignOption, CreatorListItem } from "@/types/database";
import { SUPPORTED_PLATFORMS } from "@/lib/platforms";

type CreatorFormModalProps = {
  open: boolean;
  onClose: () => void;
  campaigns: CampaignOption[];
  creator?: CreatorListItem | null;
};

type CreatorFormState = {
  platform: string;
  username: string;
  name: string;
  followers: string;
  contact: string;
  campaign_ids: string[];
};

const emptyForm: CreatorFormState = {
  platform: "TikTok",
  username: "",
  name: "",
  followers: "",
  contact: "",
  campaign_ids: [],
};

export function CreatorFormModal({
  open,
  onClose,
  campaigns,
  creator,
}: CreatorFormModalProps) {
  const isEditing = Boolean(creator);
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<CreatorFormState>(emptyForm);
  const [feeInput, setFeeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setError(null);
    if (creator) {
      setForm({
        platform: creator.platform,
        username: getCreatorDisplayUsername(creator) ?? "",
        name: creator.name,
        followers: creator.followers > 0 ? String(creator.followers) : "",
        contact: creator.contact ?? "",
        campaign_ids: creator.campaigns.map((campaign) => campaign.id),
      });
      setFeeInput(creator.fee > 0 ? String(creator.fee) : "");
      return;
    }

    setForm(emptyForm);
    setFeeInput("");
  }, [open, creator, campaigns]);

  function handleChange(field: keyof CreatorFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCampaign(campaignId: string) {
    setForm((current) => ({
      ...current,
      campaign_ids: current.campaign_ids.includes(campaignId)
        ? current.campaign_ids.filter((id) => id !== campaignId)
        : [...current.campaign_ids, campaignId],
    }));
  }

  function buildPayload(): CreatorInput | { error: string } {
    const feeResult = validateCreatorFee(feeInput);

    if (feeResult.error || feeResult.fee == null) {
      return { error: feeResult.error ?? "Fee is invalid." };
    }

    const username = form.username.trim().replace(/^@+/, "");

    if (!username) {
      return { error: "Username is required." };
    }

    return {
      name: form.name,
      username,
      tiktok_username: "",
      instagram_username: "",
      threads_username: "",
      contact: form.contact,
      notes: "",
      platform: form.platform,
      followers: form.followers.trim() ? Number(form.followers) || 0 : 0,
      fee: feeResult.fee,
      campaign_ids: form.campaign_ids,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = buildPayload();

    if ("error" in payload) {
      setError(payload.error);
      return;
    }

    startTransition(async () => {
      const result = creator
        ? await updateCreator(creator.id, payload)
        : await createCreator(payload);

      if (result.error) {
        setError(result.error);
        showError(result.error);
        return;
      }

      showSuccess(
        isEditing ? "Creator updated successfully." : "Creator added successfully.",
      );
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Creator" : "Add Creator"}
      description={
        isEditing
          ? "Update creator details and save changes."
          : "Add a creator manually, or let video imports fill username and name automatically."
      }
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Platform" htmlFor="creator-platform">
          <select
            id="creator-platform"
            name="platform"
            value={form.platform}
            onChange={(event) => handleChange("platform", event.target.value)}
            className={inputClassName}
            required
          >
            {SUPPORTED_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Username" htmlFor="creator-username">
          <input
            id="creator-username"
            name="username"
            value={form.username}
            onChange={(event) => handleChange("username", event.target.value)}
            className={inputClassName}
            placeholder="@creator"
            required
          />
        </FormField>

        <FormField label="Name" htmlFor="creator-name">
          <input
            id="creator-name"
            name="name"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={inputClassName}
            placeholder="Display name"
          />
        </FormField>

        <FormField label="Followers" htmlFor="creator-followers">
          <input
            id="creator-followers"
            name="followers"
            type="number"
            min="0"
            value={form.followers}
            onChange={(event) => handleChange("followers", event.target.value)}
            className={inputClassName}
            placeholder="0"
          />
        </FormField>

        <FormField label="Fee (IDR)" htmlFor="creator-fee">
          <input
            id="creator-fee"
            name="fee"
            type="number"
            min={MIN_CREATOR_FEE}
            step="1"
            value={feeInput}
            onChange={(event) => setFeeInput(event.target.value)}
            className={inputClassName}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-slate-500">IDR · leave blank for 0</p>
        </FormField>

        <FormField label="Contact" htmlFor="creator-contact">
          <input
            id="creator-contact"
            name="contact"
            type="text"
            value={form.contact}
            onChange={(event) => handleChange("contact", event.target.value)}
            className={inputClassName}
            placeholder="Email, phone, WhatsApp, manager, etc."
          />
        </FormField>

        <FormField label="Campaign (optional)" htmlFor="creator-campaigns">
          <div
            id="creator-campaigns"
            className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3"
          >
            {campaigns.length === 0 ? (
              <p className="text-sm text-slate-500">No campaigns available.</p>
            ) : (
              campaigns.map((campaign) => (
                <label
                  key={campaign.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={form.campaign_ids.includes(campaign.id)}
                    onChange={() => toggleCampaign(campaign.id)}
                    className="rounded border-slate-300 text-kefoo-600 focus:ring-kefoo-500"
                  />
                  <span className="text-sm text-slate-700">{campaign.name}</span>
                </label>
              ))
            )}
          </div>
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
            className="rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Save Creator"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
