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
  isDateString,
  isUuid,
  optionalText,
  parseMoney,
  text,
} from "@/lib/wedding/validation";

const BOOKING_STATUSES = [
  "considering",
  "contacted",
  "booked",
  "cancelled",
] as const;

const PAYMENT_STATUSES = ["diskusi", "dp", "lunas"] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

function revalidateVendorPages() {
  revalidateWedding("/wedding/budget", "/wedding/dashboard");
}

type VendorValues = {
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  pic_internal: string | null;
  notes: string | null;
  agreed_price: number | null;
  payment_status: (typeof PAYMENT_STATUSES)[number];
};

function readMoneyOrNull(
  formData: FormData,
  key: string,
): { ok: true; value: number | null } | { ok: false } {
  const raw = text(formData, key);
  if (!raw) return { ok: true, value: null };
  const parsed = parseMoney(raw);
  if (parsed === null) return { ok: false };
  return { ok: true, value: parsed };
}

function readVendor(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: VendorValues } | { ok: false; error: string } {
  const total = readMoneyOrNull(formData, "agreedPrice");
  if (!total.ok) {
    return { ok: false, error: copy.form.invalidNumber };
  }

  return {
    ok: true,
    values: {
      // All identity fields are optional on purpose.
      name: text(formData, "name").slice(0, 120),
      category: text(formData, "category").slice(0, 80),
      contact_name: optionalText(formData, "contactName", 120),
      phone: optionalText(formData, "phone", 40),
      pic_internal: optionalText(formData, "picInternal", 120),
      notes: optionalText(formData, "notes", 4000),
      agreed_price: total.value,
      payment_status: enumValue(
        formData,
        "paymentStatus",
        PAYMENT_STATUSES,
        "diskusi",
      ),
    },
  };
}

type Ctx = NonNullable<Awaited<ReturnType<typeof getActionContext>>>;

const PROOF_BUCKET = "payment-proofs";
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

async function storeProof(
  ctx: Ctx,
  formData: FormData,
): Promise<{ ok: true; path: string | null } | { ok: false; error: string }> {
  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, path: null };
  }
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false, error: ctx.copy.vendors.proofTooLarge };
  }
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    return { ok: false, error: ctx.copy.vendors.proofInvalidType };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "bin";
  const path = `${ctx.session.wedding.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await ctx.supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: ctx.copy.errors.generic };

  return { ok: true, path };
}

/** Optional payment captured straight from the vendor form (DP / Lunas). */
async function maybeRecordPayment(
  ctx: Ctx,
  vendorId: string,
  formData: FormData,
): Promise<string | null> {
  const raw = text(formData, "paidAmount");
  if (!raw) return null;

  const amount = parseMoney(raw);
  if (amount === null || amount <= 0) return ctx.copy.form.invalidNumber;

  const paidOn = text(formData, "paidOn") || new Date().toISOString().slice(0, 10);
  if (!isDateString(paidOn)) return ctx.copy.form.invalidDate;

  const proof = await storeProof(ctx, formData);
  if (!proof.ok) return proof.error;

  const { error } = await ctx.supabase.from("vendor_payments").insert({
    wedding_id: ctx.session.wedding.id,
    vendor_id: vendorId,
    amount,
    paid_on: paidOn,
    method: optionalText(formData, "paymentMethod", 60),
    notes: optionalText(formData, "paymentNotes", 1000),
    proof_path: proof.path,
  });

  return error ? actionError(error, ctx.copy) : null;
}

export async function createVendorAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readVendor(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { data: created, error } = await ctx.supabase
    .from("vendors")
    .insert({
      wedding_id: ctx.session.wedding.id,
      booking_status: enumValue(
        formData,
        "bookingStatus",
        BOOKING_STATUSES,
        "considering",
      ),
      ...parsed.values,
    })
    .select("id")
    .single();

  if (error || !created) return { error: actionError(error ?? { message: "" }, ctx.copy) };

  // Record the DP / pelunasan entered while creating the vendor.
  const paymentError = await maybeRecordPayment(ctx, created.id, formData);
  if (paymentError) return { error: paymentError };

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function updateVendorAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readVendor(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("vendors")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  const paymentError = await maybeRecordPayment(ctx, id, formData);
  if (paymentError) return { error: paymentError };

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  // Payment rows are removed by the ON DELETE CASCADE on vendor_payments.
  const { error } = await ctx.supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return null;
}

export async function addVendorPaymentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const vendorId = text(formData, "vendorId");
  if (!isUuid(vendorId)) return { error: ctx.copy.errors.notFound };

  const amount = parseMoney(text(formData, "amount"));
  if (amount === null || amount <= 0) {
    return { error: ctx.copy.form.invalidNumber };
  }

  const paidOn = text(formData, "paidOn") || new Date().toISOString().slice(0, 10);
  if (!isDateString(paidOn)) {
    return { error: ctx.copy.form.invalidDate };
  }

  const proof = await storeProof(ctx, formData);
  if (!proof.ok) return { error: proof.error };

  const { error } = await ctx.supabase.from("vendor_payments").insert({
    wedding_id: ctx.session.wedding.id,
    vendor_id: vendorId,
    amount,
    paid_on: paidOn,
    method: optionalText(formData, "method", 60),
    notes: optionalText(formData, "notes", 1000),
    proof_path: proof.path,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorPaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: existing } = await ctx.supabase
    .from("vendor_payments")
    .select("proof_path")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  const { error } = await ctx.supabase
    .from("vendor_payments")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  // Best effort: remove the stored proof as well.
  if (existing?.proof_path) {
    await ctx.supabase.storage.from(PROOF_BUCKET).remove([existing.proof_path]);
  }

  revalidateVendorPages();
  return null;
}
