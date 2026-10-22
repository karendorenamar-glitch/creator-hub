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
  optionalUuid,
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


/** Sum of real payments for one option. */
async function paidTotalFor(
  ctx: Awaited<ReturnType<typeof context>>,
  vendorId: string,
): Promise<number> {
  const { data } = await ctx.supabase
    .from("vendor_payments")
    .select("amount")
    .eq("vendor_id", vendorId)
    .eq("wedding_id", ctx.session.wedding.id);

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

/**
 * Keeps a group consistent after any payment change.
 *
 * Selection rule (single source of truth):
 *   - an option becomes the SELECTED vendor as soon as it has a real payment
 *     (i.e. the couple moved it to DP or Lunas);
 *   - if its payments drop back to zero, it is no longer selected;
 *   - the group status is then recomputed from the selected option only.
 */
async function refreshGroupOfVendor(
  ctx: Awaited<ReturnType<typeof context>>,
  vendorId: string,
) {
  const { data: vendor } = await ctx.supabase
    .from("vendors")
    .select("group_id")
    .eq("id", vendorId)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  const groupId = vendor?.group_id;
  if (!groupId) return;

  const [paid, { data: group }] = await Promise.all([
    paidTotalFor(ctx, vendorId),
    ctx.supabase
      .from("vendor_groups")
      .select("selected_vendor_id")
      .eq("id", groupId)
      .eq("wedding_id", ctx.session.wedding.id)
      .maybeSingle(),
  ]);

  if (!group) return;

  if (paid > 0 && group.selected_vendor_id !== vendorId) {
    // A paid option wins the selection; the DB rejects options from other groups.
    await ctx.supabase
      .from("vendor_groups")
      .update({ selected_vendor_id: vendorId })
      .eq("id", groupId)
      .eq("wedding_id", ctx.session.wedding.id);
  } else if (paid === 0 && group.selected_vendor_id === vendorId) {
    // Payments removed: back to "belum menentukan vendor".
    await ctx.supabase
      .from("vendor_groups")
      .update({ selected_vendor_id: null })
      .eq("id", groupId)
      .eq("wedding_id", ctx.session.wedding.id);
  }

  await ctx.supabase.rpc("refresh_vendor_group_status", {
    p_group_id: groupId,
  });
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
      group_id: optionalUuid(formData, "groupId"),
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

  await refreshGroupOfVendor(ctx, vendorId);
  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorPaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  // Read vendor_id BEFORE deleting so the group status can be recalculated.
  const { data: existing } = await ctx.supabase
    .from("vendor_payments")
    .select("proof_path, vendor_id")
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

  // A removed payment can turn "lunas" back into "dp" / "diskusi".
  if (existing?.vendor_id) {
    await refreshGroupOfVendor(ctx, existing.vendor_id);
  }

  revalidateVendorPages();
  return null;
}

/* -------------------------------------------------------------------------- */
/* Vendor GROUPS: one decision per category, many comparable options          */
/* -------------------------------------------------------------------------- */

export async function createVendorGroupAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const category = text(formData, "category").slice(0, 80);
  const name = (text(formData, "name") || category).slice(0, 120);

  if (!name) return { error: ctx.copy.form.required };

  const { data, error } = await ctx.supabase
    .from("vendor_groups")
    .insert({
      wedding_id: ctx.session.wedding.id,
      name,
      category,
      notes: optionalText(formData, "notes", 2000),
      pic_internal: optionalText(formData, "picInternal", 120),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: actionError(error ?? { message: "" }, ctx.copy) };
  }

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function updateVendorGroupAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const category = text(formData, "category").slice(0, 80);
  const name = (text(formData, "name") || category).slice(0, 120);
  if (!name) return { error: ctx.copy.form.required };

  const { error } = await ctx.supabase
    .from("vendor_groups")
    .update({
      name,
      category,
      notes: optionalText(formData, "notes", 2000),
      pic_internal: optionalText(formData, "picInternal", 120),
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

/** Select one option in a group. Payments stay on their original vendor. */
export async function selectVendorOptionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const groupId = text(formData, "groupId");
  const vendorId = text(formData, "vendorId");
  if (!isUuid(groupId)) return { error: ctx.copy.errors.notFound };

  // The DB rejects an option that is not part of this group (composite FK).
  const { error } = await ctx.supabase
    .from("vendor_groups")
    .update({ selected_vendor_id: isUuid(vendorId) ? vendorId : null })
    .eq("id", groupId)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  await ctx.supabase.rpc("refresh_vendor_group_status", { p_group_id: groupId });

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

/** Soft delete: keeps payment history and audit trail intact. */
export async function archiveVendorGroupAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: paid } = await ctx.supabase
    .from("vendor_payments")
    .select("id")
    .eq("wedding_id", ctx.session.wedding.id)
    .in(
      "vendor_id",
      (
        await ctx.supabase
          .from("vendors")
          .select("id")
          .eq("group_id", id)
          .eq("wedding_id", ctx.session.wedding.id)
      ).data?.map((row) => row.id) ?? ["00000000-0000-0000-0000-000000000000"],
    )
    .limit(1);

  if (paid && paid.length > 0) {
    return {
      error:
        "Kelompok ini punya riwayat pembayaran. Hapus pembayaran terlebih dahulu atau biarkan diarsipkan tanpa dihapus.",
    };
  }

  const { error } = await ctx.supabase
    .from("vendor_groups")
    .update({ archived_at: new Date().toISOString(), selected_vendor_id: null })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return null;
}

export async function archiveVendorOptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: payments } = await ctx.supabase
    .from("vendor_payments")
    .select("id")
    .eq("vendor_id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .limit(1);

  if (payments && payments.length > 0) {
    return {
      error:
        "Opsi ini punya riwayat pembayaran dan tidak bisa diarsipkan. Selesaikan atau hapus pembayarannya dulu.",
    };
  }

  const { error } = await ctx.supabase
    .from("vendors")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return null;
}
