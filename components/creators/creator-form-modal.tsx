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

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Threads", "Twitch", "Other"];

const USERNAME_FIELDS = {
  TikTok: "tiktok_username",
  Instagram: "instagram_username",
  Threads: "threads_username",
} as const;

type UsernameFieldKey =
  (typeof USERNAME_FIELDS)[keyof typeof USERNAME_FIELDS];

type CreatorFormModalProps = {
  open: boolean;
  onClose: () => void;
  creator?: Creator | null;
};

type CreatorFormState = Omit<CreatorInput, "fee">;

const emptyForm: CreatorFormState = {
  name: "",
  tiktok_username: "",
  instagram_username: "",
  threads_username: "",
  contact: "",
  notes: "",
  platform: "YouTube",
  followers: 0,
};

function getUsernameFieldKey(platform: string): UsernameFieldKey | null {
  if (platform in USERNAME_FIELDS) {
    return USERNAME_FIELDS[platform as keyof typeof USERNAME_FIELDS];
  }

  return null;
}

function getUsernameLabel(platform: string) {
  switch (platform) {
    case "TikTok":
      return "TikTok Username";
    case "Instagram":
      return "Instagram Username";
    case "Threads":
      return "Threads Username";
    default:
      return "Username";
  }
}

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchingTikTok, setIsFetchingTikTok] = useState(false);
  const [isPending, startTransition] = useTransition();

  const usernameFieldKey = getUsernameFieldKey(form.platform);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setFetchError(null);
    if (creator) {
      setForm({
        name: creator.name,
        tiktok_username: creator.tiktok_username ?? "",
        instagram_username: creator.instagram_username ?? "",
        threads_username: creator.threads_username ?? "",
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

  function handleUsernameChange(value: string) {
    if (!usernameFieldKey) return;

    setFetchError(null);
    setForm((current) => ({ ...current, [usernameFieldKey]: value }));
  }

  async function handleFetchTikTokData() {
    const username = form.tiktok_username.trim();

    if (!username) {
      setFetchError("Enter a TikTok username before fetching profile data.");
      return;
    }

    setFetchError(null);
    setIsFetchingTikTok(true);

    try {
      const response = await fetch("/api/tiktok/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const result = (await response.json()) as {
        data?: { followers: number; name: string | null };
        error?: string;
      };

      if (!response.ok || result.error) {
        setFetchError(result.error ?? "Failed to fetch TikTok profile.");
        return;
      }

      if (result.data) {
        setForm((current) => ({
          ...current,
          followers: result.data!.followers,
          ...(result.data!.name ? { name: result.data!.name } : {}),
        }));
        showSuccess("TikTok profile data loaded.");
      }
    } catch {
      setFetchError("Failed to fetch TikTok profile.");
    } finally {
      setIsFetchingTikTok(false);
    }
  }

  function buildPayload(): CreatorInput | { error: string } {
    const feeResult = validateCreatorFee(feeInput);

    if (feeResult.error || feeResult.fee == null) {
      return { error: feeResult.error ?? "Fee is required." };
    }

    return {
      name: form.name,
      tiktok_username: form.tiktok_username,
      instagram_username: form.instagram_username,
      threads_username: form.threads_username,
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

        {usernameFieldKey && (
          <FormField
            label={getUsernameLabel(form.platform)}
            htmlFor="creator-platform-username"
          >
            {form.platform === "TikTok" ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="creator-platform-username"
                    name={usernameFieldKey}
                    value={form[usernameFieldKey]}
                    onChange={(event) =>
                      handleUsernameChange(event.target.value)
                    }
                    className={inputClassName}
                    placeholder="@username"
                  />
                  <button
                    type="button"
                    onClick={handleFetchTikTokData}
                    disabled={
                      isPending ||
                      isFetchingTikTok ||
                      !form.tiktok_username.trim()
                    }
                    className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                  >
                    {isFetchingTikTok ? "Fetching..." : "Fetch TikTok Data"}
                  </button>
                </div>
                {fetchError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {fetchError}
                  </p>
                )}
              </div>
            ) : (
              <input
                id="creator-platform-username"
                name={usernameFieldKey}
                value={form[usernameFieldKey]}
                onChange={(event) =>
                  handleUsernameChange(event.target.value)
                }
                className={inputClassName}
                placeholder="@username"
              />
            )}
          </FormField>
        )}

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
