"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { isHttpUrl, isUuid, optionalText, text } from "@/lib/wedding/validation";

const IMAGE_BUCKET = "inspiration-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Ctx = NonNullable<Awaited<ReturnType<typeof getActionContext>>>;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

function readFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const entry of formData.getAll("images")) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  const single = formData.get("image");
  if (single instanceof File && single.size > 0) files.push(single);
  return files;
}

async function storeImages(
  ctx: Ctx,
  formData: FormData,
): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  const files = readFiles(formData);
  const paths: string[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: ctx.copy.inspiration.imageTooLarge };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { ok: false, error: ctx.copy.inspiration.imageInvalidType };
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const path = `${ctx.session.wedding.id}/${crypto.randomUUID()}.${extension}`;

    const { error } = await ctx.supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) return { ok: false, error: ctx.copy.errors.generic };
    paths.push(path);
  }

  return { ok: true, paths };
}

type ItemValues = {
  title: string;
  description: string | null;
  category: string;
  link_url: string | null;
};

function readItem(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: ItemValues } | { ok: false; error: string } {
  const title = text(formData, "title").slice(0, 120);
  if (!title) return { ok: false, error: copy.form.required };

  const linkUrl = optionalText(formData, "linkUrl", 1000);
  if (linkUrl && !isHttpUrl(linkUrl)) {
    return { ok: false, error: copy.form.invalidUrl };
  }

  return {
    ok: true,
    values: {
      title,
      description: optionalText(formData, "description", 2000),
      category: text(formData, "category").slice(0, 80),
      link_url: linkUrl,
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

  const images = await storeImages(ctx, formData);
  if (!images.ok) return { error: images.error };

  const { data: created, error } = await ctx.supabase
    .from("inspiration_items")
    .insert({
      wedding_id: ctx.session.wedding.id,
      image_path: images.paths[0] ?? null,
      ...parsed.values,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: actionError(error ?? { message: "" }, ctx.copy) };
  }

  if (images.paths.length > 0) {
    const { error: photoError } = await ctx.supabase
      .from("inspiration_photos")
      .insert(
        images.paths.map((path, index) => ({
          wedding_id: ctx.session.wedding.id,
          item_id: created.id,
          path,
          sort_order: index,
        })),
      );

    if (photoError) return { error: actionError(photoError, ctx.copy) };
  }

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

  const images = await storeImages(ctx, formData);
  if (!images.ok) return { error: images.error };

  const { error } = await ctx.supabase
    .from("inspiration_items")
    .update({
      ...parsed.values,
      ...(images.paths[0] ? { image_path: images.paths[0] } : {}),
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  if (images.paths.length > 0) {
    const { error: photoError } = await ctx.supabase
      .from("inspiration_photos")
      .insert(
        images.paths.map((path, index) => ({
          wedding_id: ctx.session.wedding.id,
          item_id: id,
          path,
          sort_order: 100 + index,
        })),
      );

    if (photoError) return { error: actionError(photoError, ctx.copy) };
  }

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}

export async function deleteInspirationPhotoAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: photo } = await ctx.supabase
    .from("inspiration_photos")
    .select("path")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  const { error } = await ctx.supabase
    .from("inspiration_photos")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  if (photo?.path) {
    await ctx.supabase.storage.from(IMAGE_BUCKET).remove([photo.path]);
  }

  revalidateWedding("/wedding/inspiration");
  return null;
}

export async function deleteInspirationAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const [{ data: item }, { data: photos }] = await Promise.all([
    ctx.supabase
      .from("inspiration_items")
      .select("image_path")
      .eq("id", id)
      .eq("wedding_id", ctx.session.wedding.id)
      .maybeSingle(),
    ctx.supabase
      .from("inspiration_photos")
      .select("path")
      .eq("item_id", id)
      .eq("wedding_id", ctx.session.wedding.id),
  ]);

  const { error } = await ctx.supabase
    .from("inspiration_items")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  const paths = [
    ...(photos ?? []).map((photo) => photo.path),
    ...(item?.image_path ? [item.image_path] : []),
  ];
  if (paths.length > 0) {
    await ctx.supabase.storage.from(IMAGE_BUCKET).remove(paths);
  }

  revalidateWedding("/wedding/inspiration");
  return null;
}

