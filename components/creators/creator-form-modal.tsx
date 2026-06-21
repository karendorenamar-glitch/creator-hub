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
import { MIN_CREATOR_FEE, validateCreatorFee } from "@/lib/utils";
import type { Creator } from "@/types/database";

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Twitch", "Other"];

type CreatorFormModalProps = {
  open: boolean;
  onClose: () => void;
  creator?: Creator | null;
};

type CreatorFormState = Omit<CreatorInput, "fee">;

const emptyForm: CreatorFormState = {
  name: "",
  username: "",
  contact: "",
  notes: "",
  platform: "YouTube",
  followers: 0,
};

export function CreatorFormModal({
  open,
  onClose,
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
        name: creator.name,
        username: creator.username ?? "",
        contact: creator.contact ?? "",
        notes: creator.notes ?? "",
        platform: creator.platform,
        followers: creator.followers,
      });
      setFeeInput(String(creator.fee));
      return;
    }

    setForm(emptyForm);
    setFeeInput("0");
  }, [open, creator]);

  function handleChange(
    field: keyof CreatorFormState,
    value: string | number,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload(): CreatorInput | { error: string } {
    const feeResult = validateCreatorFee(feeInput);

    if (feeResult.error || feeResult.fee == null) {
      return { error: feeResult.error ?? "Fee is required." };
    }

    return {
      name: form.name,
      username: form.username,
      contact: form.contact,
      notes: form.notes,
      platform: form.platform,
      followers: form.followers,
      fee: feeResult.fee,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.username.trim()) {
      setError("TikTok username is required.");
      return;
    }

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
          : "Add a new creator to your hub."
      }
      loading={isPending}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="creator-name">
          <input
            id="creator-name"
            name="name"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={inputClassName}
            placeholder="Creator name"
            required
          />
        </FormField>

        <FormField label="TikTok Username" htmlFor="creator-username">
          <input
            id="creator-username"
            name="username"
            value={form.username}
            onChange={(event) => handleChange("username", event.target.value)}
            className={inputClassName}
            placeholder="@username"
            required
          />
        </FormField>

        <FormField label="Platform" htmlFor="creator-platform">
          <select
            id="creator-platform"
            name="platform"
            value={form.platform}
            onChange={(event) => handleChange("platform", event.target.value)}
            className={inputClassName}
            required
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Followers" htmlFor="creator-followers">
          <input
            id="creator-followers"
            name="followers"
            type="number"
            min="0"
            value={form.followers}
            onChange={(event) =>
              handleChange("followers", Number(event.target.value) || 0)
            }
            className={inputClassName}
            required
          />
        </FormField>

        <FormField label="Fee (IDR)" htmlFor="creator-fee">
          <input
            id="creator-fee"
            name="fee"
            type="number"
            min={MIN_CREATOR_FEE}
            step="1"
            required
            value={feeInput}
            onChange={(event) => setFeeInput(event.target.value)}
            className={inputClassName}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-slate-500">
            Minimum {MIN_CREATOR_FEE.toLocaleString("id-ID")} IDR
          </p>
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

        <FormField label="Notes" htmlFor="creator-notes">
          <textarea
            id="creator-notes"
            name="notes"
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            className={`${inputClassName} min-h-24 resize-y`}
            placeholder="Internal notes about this creator"
            rows={4}
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
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
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
