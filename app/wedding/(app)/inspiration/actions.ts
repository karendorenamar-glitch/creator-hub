"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  enumValue,
  isHttpUrl,
  isUuid,
  optionalText,
  text,
} from "@/lib/wedding/validation";

const CATEGORIES = [
  "wedding_dress",
  "decoration",
  "flowers",
  "invitations",
  "makeup",
  "venue",
  "other",
] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type InspirationValues = {
  title: string;
  description: string | null;
  category: (typeof CATEGORIES)[number];
  link_url: string | null;
  image_url: string | null;
  notes: string | null;
};

function readItem(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: InspirationValues } | { ok: false; error: string } {
  const title = text(formData, "title").slice(0, 120);
  if (!title) return { ok: false, error: copy.form.required };

  const linkUrl = optionalText(formData, "linkUrl", 1000);
  if (linkUrl && !isHttpUrl(linkUrl)) {
    return { ok: false, error: copy.form.invalidUrl };
  }

  const imageUrl = optionalText(formData, "imageUrl", 1000);
  if (imageUrl && !isHttpUrl(imageUrl)) {
    return { ok: false, error: copy.form.invalidUrl };
  }

  return {
    ok: true,
    values: {
      title,
      description: optionalText(formData, "description", 2000),
      category: enumValue(formData, "category", CATEGORIES, "other"),
      link_url: linkUrl,
      image_url: imageUrl,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}

export async function createInspirationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readItem(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("inspiration_items").insert({
    wedding_id: ctx.session.wedding.id,
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}

export async function updateInspirationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readItem(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("inspiration_items")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}

export async function deleteInspirationAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("inspiration_items")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return null;
}
