"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { InvitationContent } from "@/lib/wedding/db-types";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { isHttpUrl, isUuid, optionalText, text } from "@/lib/wedding/validation";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function readUrl(
  formData: FormData,
  key: string,
  copy: ModuleCopy,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const raw = optionalText(formData, key, 1000);
  if (!raw) return { ok: true, value: null };
  if (!isHttpUrl(raw)) return { ok: false, error: copy.form.invalidUrl };
  return { ok: true, value: raw };
}

export async function saveInvitationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();

  const slug = normalizeSlug(text(formData, "slug"));
  if (slug.length < 3) {
    return { error: ctx.copy.invitation.slugInvalid };
  }

  const mapsUrl = readUrl(formData, "mapsUrl", ctx.copy);
  const coverImageUrl = readUrl(formData, "coverImageUrl", ctx.copy);
  const coupleImageUrl = readUrl(formData, "coupleImageUrl", ctx.copy);
  const musicUrl = readUrl(formData, "musicUrl", ctx.copy);

  if (!mapsUrl.ok) return { error: mapsUrl.error };
  if (!coverImageUrl.ok) return { error: coverImageUrl.error };
  if (!coupleImageUrl.ok) return { error: coupleImageUrl.error };
  if (!musicUrl.ok) return { error: musicUrl.error };

  const content: InvitationContent = {
    tagline: optionalText(formData, "tagline", 160),
    story: optionalText(formData, "story", 4000),
    ceremonyTime: optionalText(formData, "ceremonyTime", 120),
    ceremonyPlace: optionalText(formData, "ceremonyPlace", 160),
    receptionTime: optionalText(formData, "receptionTime", 120),
    receptionPlace: optionalText(formData, "receptionPlace", 160),
    venueAddress: optionalText(formData, "venueAddress", 400),
    mapsUrl: mapsUrl.value,
    dressCode: optionalText(formData, "dressCode", 200),
    closingMessage: optionalText(formData, "closingMessage", 1000),
    coverImageUrl: coverImageUrl.value,
    coupleImageUrl: coupleImageUrl.value,
    musicUrl: musicUrl.value,
  };

  const { error } = await ctx.supabase.from("invitations").upsert(
    {
      wedding_id: ctx.session.wedding.id,
      slug,
      content,
    },
    { onConflict: "wedding_id" },
  );

  if (error) {
    if (error.code === "23505") {
      return { error: ctx.copy.invitation.slugTaken };
    }
    return { error: actionError(error, ctx.copy) };
  }

  revalidateWedding("/wedding/invitation");
  return { success: ctx.copy.form.saved };
}

export async function publishInvitationAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const publish = text(formData, "publish") === "true";

  const { error } = await ctx.supabase
    .from("invitations")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/invitation");
  return null;
}

export async function publishInvitationFormAction(
  formData: FormData,
): Promise<void> {
  await publishInvitationAction(formData);
}

export async function deleteRsvpAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("invitation_rsvps")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/invitation");
  return null;
}
