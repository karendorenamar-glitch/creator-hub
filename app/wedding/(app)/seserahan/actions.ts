"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/wedding/action-context";
import { convertInputAmounts } from "@/lib/currency/action";
import { isUuid, optionalText, parseWholeRupiah, text } from "@/lib/wedding/validation";
import { redirect } from "next/navigation";

const BUCKET = "seserahan-photos";
const PATH = "/wedding/seserahan";
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SeserahanState = { error?: string; success?: string } | null;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type Ctx = Awaited<ReturnType<typeof context>>;

function party(value: string): "groom" | "bride" | null {
  return value === "groom" || value === "bride" ? value : null;
}

function status(value: string): "purchased" | "not_purchased" {
  return value === "purchased" ? "purchased" : "not_purchased";
}

function photoFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function storePhotos(
  ctx: Ctx,
  itemId: string,
  files: File[],
  startIndex: number,
): Promise<string[]> {
  const uploaded: string[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size > MAX_BYTES) continue;
    if (!TYPES.includes(file.type as (typeof TYPES)[number])) continue;

    const ext = file.name.split(".").pop()?.toLowerCase().slice(0, 5) ?? "jpg";
    const path = `${ctx.session.wedding.id}/${itemId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await ctx.supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("[seserahan upload]", error.message);
      continue;
    }

    const { error: rowError } = await ctx.supabase.from("seserahan_photos").insert({
      wedding_id: ctx.session.wedding.id,
      item_id: itemId,
      path,
      mime_type: file.type,
      original_name: file.name.slice(0, 200),
      sort_order: startIndex + index,
    });

    if (rowError) {
      console.error("[seserahan photo row]", rowError.message);
      await ctx.supabase.storage.from(BUCKET).remove([path]);
      continue;
    }

    uploaded.push(path);
  }

  return uploaded;
}

export async function createItemAction(
  _prev: SeserahanState,
  formData: FormData,
): Promise<SeserahanState> {
  const ctx = await context();
  const side = party(text(formData, "party"));
  if (!side) return { error: "Pilih pihak pria atau wanita." };

  const name = text(formData, "name").trim().slice(0, 120);
  if (!name) return { error: "Nama item wajib diisi." };

  const priceInput = text(formData, "price");
  const displayPrice = priceInput === "" ? 0 : parseWholeRupiah(priceInput, { allowZero: true });
  if (displayPrice === null) return { error: "Harga tidak valid." };

  const conversion = await convertInputAmounts(ctx.supabase, ctx.session.userId, [displayPrice]);
  if (!conversion) return { error: "Kurs mata uang tidak tersedia. Belum ada yang disimpan." };

  const quantityRaw = Number(text(formData, "quantity") || "1");
  const quantity = Number.isFinite(quantityRaw) ? Math.min(999, Math.max(1, Math.round(quantityRaw))) : 1;

  const categoryRaw = text(formData, "categoryId");
  let categoryId = isUuid(categoryRaw) ? categoryRaw : null;

  const newCategory = text(formData, "newCategory");
  if (newCategory) categoryId = (await ensureCategory(ctx, newCategory)) ?? categoryId;

  const { data: created, error } = await ctx.supabase
    .from("seserahan_items")
    .insert({
      wedding_id: ctx.session.wedding.id,
      party: side,
      name,
      category_id: categoryId,
      price: conversion.idr[0],
      quantity,
      status: status(text(formData, "status")),
      notes: optionalText(formData, "notes", 2000),
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[createItemAction]", error?.message);
    return { error: "Gagal menyimpan item. Coba lagi." };
  }

  await storePhotos(ctx, created.id, photoFiles(formData), 0);
  revalidatePath(PATH);
  return { success: "Item tersimpan." };
}

export async function updateItemAction(
  _prev: SeserahanState,
  formData: FormData,
): Promise<SeserahanState> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Item tidak ditemukan." };

  const side = party(text(formData, "party"));
  if (!side) return { error: "Pilih pihak pria atau wanita." };

  const name = text(formData, "name").trim().slice(0, 120);
  if (!name) return { error: "Nama item wajib diisi." };

  // Empty price on edit means "keep the stored price".
  const priceInput = text(formData, "price");
  let priceIdr: number | undefined;
  if (priceInput !== "") {
    const displayPrice = parseWholeRupiah(priceInput, { allowZero: true });
    if (displayPrice === null) return { error: "Harga tidak valid." };

    const conversion = await convertInputAmounts(ctx.supabase, ctx.session.userId, [displayPrice]);
    if (!conversion) return { error: "Kurs mata uang tidak tersedia. Belum ada yang disimpan." };
    priceIdr = conversion.idr[0];
  }

  const quantityRaw = Number(text(formData, "quantity") || "1");
  const quantity = Number.isFinite(quantityRaw) ? Math.min(999, Math.max(1, Math.round(quantityRaw))) : 1;
  const categoryRaw = text(formData, "categoryId");
  let categoryId = isUuid(categoryRaw) ? categoryRaw : null;

  const newCategory = text(formData, "newCategory");
  if (newCategory) categoryId = (await ensureCategory(ctx, newCategory)) ?? categoryId;

  const { error } = await ctx.supabase
    .from("seserahan_items")
    .update({
      party: side,
      name,
      category_id: categoryId,
      ...(priceIdr === undefined ? {} : { price: priceIdr }),
      quantity,
      status: status(text(formData, "status")),
      notes: optionalText(formData, "notes", 2000),
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) {
    console.error("[updateItemAction]", error.message);
    return { error: "Gagal menyimpan item. Coba lagi." };
  }

  const { count } = await ctx.supabase
    .from("seserahan_photos")
    .select("id", { count: "exact", head: true })
    .eq("item_id", id);

  await storePhotos(ctx, id, photoFiles(formData), count ?? 0);
  revalidatePath(PATH);
  return { success: "Item diperbarui." };
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return;

  const { data: photos } = await ctx.supabase
    .from("seserahan_photos")
    .select("path")
    .eq("item_id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  await ctx.supabase
    .from("seserahan_items")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  const paths = (photos ?? []).map((row) => row.path);
  if (paths.length > 0) await ctx.supabase.storage.from(BUCKET).remove(paths);

  revalidatePath(PATH);
}

export async function toggleItemStatusAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return;

  const next = status(text(formData, "status"));
  await ctx.supabase
    .from("seserahan_items")
    .update({ status: next })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  revalidatePath(PATH);
}

async function ensureCategory(ctx: Ctx, name: string): Promise<string | null> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return null;

  const { data: existing } = await ctx.supabase
    .from("seserahan_categories")
    .select("id")
    .eq("wedding_id", ctx.session.wedding.id)
    .ilike("name", clean)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await ctx.supabase
    .from("seserahan_categories")
    .insert({ wedding_id: ctx.session.wedding.id, name: clean })
    .select("id")
    .single();

  return created?.id ?? null;
}

export async function createCategoryAction(
  _prev: SeserahanState,
  formData: FormData,
): Promise<SeserahanState> {
  const ctx = await context();
  const name = text(formData, "name").trim().slice(0, 60);
  if (!name) return { error: "Nama kategori wajib diisi." };

  const id = await ensureCategory(ctx, name);
  if (!id) return { error: "Kategori gagal disimpan (mungkin sudah ada)." };

  revalidatePath(PATH);
  return { success: "Kategori ditambahkan." };
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  const name = text(formData, "name").trim().slice(0, 60);
  if (!isUuid(id) || !name) return;

  await ctx.supabase
    .from("seserahan_categories")
    .update({ name })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  revalidatePath(PATH);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return;

  // Items keep existing: the foreign key is ON DELETE SET NULL.
  await ctx.supabase
    .from("seserahan_categories")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  revalidatePath(PATH);
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return;

  const { data: photo } = await ctx.supabase
    .from("seserahan_photos")
    .select("id, path")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();
  if (!photo) return;

  await ctx.supabase
    .from("seserahan_photos")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  await ctx.supabase.storage.from(BUCKET).remove([photo.path]);
  revalidatePath(PATH);
}

export async function addCategoryAction(formData: FormData): Promise<void> {
  const ctx = await context();
  const name = text(formData, "name").trim().slice(0, 60);
  if (!name) return;

  await ensureCategory(ctx, name);
  revalidatePath(PATH);
}
