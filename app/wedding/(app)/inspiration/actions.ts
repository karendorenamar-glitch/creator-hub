"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { isHttpUrl, isUuid, optionalText, parseWholeRupiah, text } from "@/lib/wedding/validation";
import {
  INSPIRATION_IMAGE_BUCKET,
  validateInspirationImageFile,
} from "@/lib/wedding/uploads";

const IMAGE_BUCKET = INSPIRATION_IMAGE_BUCKET;

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
    const validation = validateInspirationImageFile(file);
    if (!validation.ok) {
      if (paths.length > 0) {
        await ctx.supabase.storage.from(IMAGE_BUCKET).remove(paths);
      }
      return {
        ok: false,
        error:
          validation.error === "too_large"
            ? ctx.copy.inspiration.imageTooLarge
            : ctx.copy.inspiration.imageInvalidType,
      };
    }

    const path = `${ctx.session.wedding.id}/${crypto.randomUUID()}.${validation.extension}`;

    const { error } = await ctx.supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      if (paths.length > 0) {
        await ctx.supabase.storage.from(IMAGE_BUCKET).remove(paths);
      }
      return { ok: false, error: ctx.copy.errors.generic };
    }
    paths.push(path);
  }

  return { ok: true, paths };
}

type ItemValues = {
  title: string;
  category: string;
  link_url: string | null;
  notes: string | null;
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
      category: text(formData, "category").slice(0, 80),
      link_url: linkUrl,
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
    if (images.paths.length > 0) {
      await ctx.supabase.storage.from(IMAGE_BUCKET).remove(images.paths);
    }
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

    if (photoError) {
      await ctx.supabase
        .from("inspiration_items")
        .delete()
        .eq("id", created.id)
        .eq("wedding_id", ctx.session.wedding.id);
      await ctx.supabase.storage.from(IMAGE_BUCKET).remove(images.paths);
      return { error: actionError(photoError, ctx.copy) };
    }
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

  let newPhotoIds: string[] = [];

  if (images.paths.length > 0) {
    const { data: inserted, error: photoError } = await ctx.supabase
      .from("inspiration_photos")
      .insert(
        images.paths.map((path, index) => ({
          wedding_id: ctx.session.wedding.id,
          item_id: id,
          path,
          sort_order: 100 + index,
        })),
      )
      .select("id");

    if (photoError) {
      await ctx.supabase.storage.from(IMAGE_BUCKET).remove(images.paths);
      return { error: actionError(photoError, ctx.copy) };
    }
    newPhotoIds = (inserted ?? []).map((row) => row.id);
  }

  const { error } = await ctx.supabase
    .from("inspiration_items")
    .update({
      ...parsed.values,
      ...(images.paths[0] ? { image_path: images.paths[0] } : {}),
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) {
    if (newPhotoIds.length > 0) {
      await ctx.supabase
        .from("inspiration_photos")
        .delete()
        .in("id", newPhotoIds)
        .eq("wedding_id", ctx.session.wedding.id);
    }
    await ctx.supabase.storage.from(IMAGE_BUCKET).remove(images.paths);
    return { error: actionError(error, ctx.copy) };
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
    .select("path, item_id")
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

  if (photo?.item_id) {
    const { data: nextPhoto } = await ctx.supabase
      .from("inspiration_photos")
      .select("path")
      .eq("item_id", photo.item_id)
      .eq("wedding_id", ctx.session.wedding.id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    await ctx.supabase
      .from("inspiration_items")
      .update({ image_path: nextPhoto?.path ?? null })
      .eq("id", photo.item_id)
      .eq("wedding_id", ctx.session.wedding.id)
      .eq("image_path", photo.path);
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


async function uploadFile(
  ctx: Ctx,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const validation = validateInspirationImageFile(file);
  if (!validation.ok) {
    return {
      ok: false,
      error:
        validation.error === "too_large"
          ? ctx.copy.inspiration.imageTooLarge
          : ctx.copy.inspiration.imageInvalidType,
    };
  }

  const path = `${ctx.session.wedding.id}/${crypto.randomUUID()}.${validation.extension}`;

  const { error } = await ctx.supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: ctx.copy.errors.generic };
  return { ok: true, path };
}

export async function replaceInspirationPhotoAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: ctx.copy.form.required };
  }

  const { data: existing } = await ctx.supabase
    .from("inspiration_photos")
    .select("path, item_id")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!existing) return { error: ctx.copy.errors.notFound };

  const uploaded = await uploadFile(ctx, file);
  if (!uploaded.ok) return { error: uploaded.error };

  const { error } = await ctx.supabase
    .from("inspiration_photos")
    .update({ path: uploaded.path })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) {
    await ctx.supabase.storage.from(IMAGE_BUCKET).remove([uploaded.path]);
    return { error: actionError(error, ctx.copy) };
  }

  if (existing?.item_id) {
    await ctx.supabase
      .from("inspiration_items")
      .update({ image_path: uploaded.path })
      .eq("id", existing.item_id)
      .eq("wedding_id", ctx.session.wedding.id)
      .eq("image_path", existing.path);
  }

  if (existing?.path) {
    await ctx.supabase.storage.from(IMAGE_BUCKET).remove([existing.path]);
  }

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}


type VendorOptionValues = {
  vendor_name: string;
  instagram_url: string | null;
  reference_price: number | null;
};

function readVendorOption(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: VendorOptionValues } | { ok: false; error: string } {
  const vendorName = text(formData, "vendorName").slice(0, 120);
  if (!vendorName) return { ok: false, error: copy.form.required };

  const instagramUrl = optionalText(formData, "instagramUrl", 1000);
  if (instagramUrl && !isHttpUrl(instagramUrl)) {
    return { ok: false, error: copy.form.invalidUrl };
  }

  const rawPrice = text(formData, "referencePrice");
  const referencePrice =
    rawPrice === "" ? null : parseWholeRupiah(rawPrice, { allowZero: true });
  if (rawPrice !== "" && referencePrice === null) {
    return { ok: false, error: copy.form.invalidNumber };
  }

  return {
    ok: true,
    values: {
      vendor_name: vendorName,
      instagram_url: instagramUrl,
      reference_price: referencePrice,
    },
  };
}

export async function createInspirationVendorOptionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const itemId = text(formData, "itemId");
  if (!isUuid(itemId)) return { error: ctx.copy.errors.notFound };

  const { data: item } = await ctx.supabase
    .from("inspiration_items")
    .select("id")
    .eq("id", itemId)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!item) return { error: ctx.copy.errors.notFound };

  const parsed = readVendorOption(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("inspiration_vendor_options")
    .insert({
      wedding_id: ctx.session.wedding.id,
      item_id: itemId,
      ...parsed.values,
    });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}

export async function updateInspirationVendorOptionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readVendorOption(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("inspiration_vendor_options")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return { success: ctx.copy.form.saved };
}

export async function deleteInspirationVendorOptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("inspiration_vendor_options")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/inspiration");
  return null;
}

