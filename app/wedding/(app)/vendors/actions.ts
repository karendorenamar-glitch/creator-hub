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
  PAYMENT_PROOF_BUCKET,
  validatePaymentProofFile,
} from "@/lib/wedding/uploads";
import {
  enumValue,
  isRealDate,
  isUuid,
  optionalText,
  parseWholeRupiah,
  text,
} from "@/lib/wedding/validation";

const PAYMENT_KINDS = ["dp", "lanjutan", "pelunasan"] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type Ctx = Awaited<ReturnType<typeof context>>;

function revalidateVendorPages() {
  revalidateWedding("/wedding/vendors", "/wedding/budget");
}

type VendorValues = {
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  notes: string | null;
  agreed_price: number | null;
  collaboration_completed: boolean;
};

function readVendor(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: VendorValues } | { ok: false; error: string } {
  const name = text(formData, "name").slice(0, 120);
  if (!name) return { ok: false, error: copy.form.required };

  const rawAgreedPrice = text(formData, "agreedPrice");
  let agreedPrice: number | null = null;
  if (rawAgreedPrice !== "") {
    agreedPrice = parseWholeRupiah(rawAgreedPrice, { allowZero: true });
    if (agreedPrice === null) {
      return { ok: false, error: copy.form.invalidNumber };
    }
  }

  return {
    ok: true,
    values: {
      name,
      category: text(formData, "category").slice(0, 80) || "Lainnya",
      contact_name: optionalText(formData, "contactName", 120),
      phone: optionalText(formData, "phone", 40),
      notes: optionalText(formData, "notes", 4000),
      agreed_price: agreedPrice,
      collaboration_completed:
        text(formData, "collaborationCompleted") === "yes",
    },
  };
}

export async function createVendorAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readVendor(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  // Optional initial payment in the same form. Validate before creating the
  // vendor so an invalid amount/date cannot leave a half-created vendor.
  const hasInitialPayment = text(formData, "paymentAmount") !== "";
  if (hasInitialPayment) {
    const payment = readPayment(formData, ctx.copy);
    if (!payment.ok) return { error: payment.error };
  }

  const { collaboration_completed, ...vendorFields } = parsed.values;
  const completedAt =
    parsed.values.agreed_price === 0 && collaboration_completed
      ? new Date().toISOString()
      : null;

  const { data: created, error } = await ctx.supabase
    .from("vendors")
    .insert({
      wedding_id: ctx.session.wedding.id,
      ...vendorFields,
      collaboration_completed_at: completedAt,
      selection_status: "terpilih",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: actionError(error ?? { message: "" }, ctx.copy) };
  }

  if (hasInitialPayment) {
    formData.set("vendorId", created.id);
    const paymentResult = await createVendorPaymentAction(null, formData);
    if (paymentResult?.error) {
      // Compensate: do not leave a vendor created without its intended payment.
      await ctx.supabase
        .from("vendors")
        .delete()
        .eq("id", created.id)
        .eq("wedding_id", ctx.session.wedding.id);
      revalidateVendorPages();
      return paymentResult;
    }

    // A duplicate idempotency key can return success without inserting a row
    // for this new vendor. Never leave that vendor behind.
    const { count } = await ctx.supabase
      .from("vendor_payments")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", created.id)
      .eq("wedding_id", ctx.session.wedding.id);

    if (count === 0) {
      await ctx.supabase
        .from("vendors")
        .delete()
        .eq("id", created.id)
        .eq("wedding_id", ctx.session.wedding.id);
      revalidateVendorPages();
      return { error: ctx.copy.errors.generic };
    }
  }

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

  const { data: existing } = await ctx.supabase
    .from("vendors")
    .select("collaboration_completed_at")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!existing) return { error: ctx.copy.errors.notFound };

  const { collaboration_completed, ...vendorFields } = parsed.values;

  // Preserve completion on ordinary detail edits. Only an explicit checkbox
  // state on a zero-price vendor can set or clear it.
  let completedAt = existing.collaboration_completed_at;
  if (parsed.values.agreed_price === 0) {
    completedAt = collaboration_completed
      ? (existing.collaboration_completed_at ?? new Date().toISOString())
      : null;
  }

  const { error } = await ctx.supabase
    .from("vendors")
    .update({
      ...vendorFields,
      collaboration_completed_at: completedAt,
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function archiveVendorAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("vendors")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return null;
}

export async function restoreVendorAction(
  formData: FormData,
): Promise<void> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return;

  const { error } = await ctx.supabase
    .from("vendors")
    .update({ archived_at: null, selection_status: "terpilih" })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return;

  revalidateVendorPages();
}

type ProofUpload = {
  path: string;
  mime_type: "image/png" | "image/jpeg" | "application/pdf";
  original_name: string;
  sort_order: number;
};

function readProofFiles(formData: FormData): File[] {
  return formData
    .getAll("proof")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function proofError(
  error: "too_large" | "invalid_type" | "invalid_extension",
  copy: ModuleCopy,
): string {
  return error === "too_large"
    ? copy.vendors.proofTooLarge
    : copy.vendors.proofInvalidType;
}

async function removeStoredFiles(ctx: Ctx, paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return;
  await ctx.supabase.storage.from(PAYMENT_PROOF_BUCKET).remove(unique);
}

async function uploadProofFiles(
  ctx: Ctx,
  paymentId: string,
  files: File[],
): Promise<{ ok: true; proofs: ProofUpload[] } | { ok: false; error: string }> {
  const uploaded: ProofUpload[] = [];

  for (const [index, file] of files.entries()) {
    const validation = validatePaymentProofFile(file);
    if (!validation.ok) {
      await removeStoredFiles(
        ctx,
        uploaded.map((proof) => proof.path),
      );
      return { ok: false, error: proofError(validation.error, ctx.copy) };
    }

    const path = `${ctx.session.wedding.id}/${paymentId}/${crypto.randomUUID()}.${validation.extension}`;
    const { error } = await ctx.supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      await removeStoredFiles(
        ctx,
        uploaded.map((proof) => proof.path),
      );
      return { ok: false, error: ctx.copy.errors.generic };
    }

    uploaded.push({
      path,
      mime_type: file.type as ProofUpload["mime_type"],
      original_name: file.name.slice(0, 255),
      sort_order: index,
    });
  }

  return { ok: true, proofs: uploaded };
}

type PaymentValues = {
  amount: number;
  paid_on: string;
  method: string | null;
  notes: string | null;
  payment_kind: (typeof PAYMENT_KINDS)[number];
};

function readPayment(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: PaymentValues } | { ok: false; error: string } {
  const amount = parseWholeRupiah(
    text(formData, "paymentAmount") || text(formData, "amount"),
    { allowZero: false },
  );
  if (amount === null) return { ok: false, error: copy.form.invalidNumber };

  const paidOn = text(formData, "paidOn") || new Date().toISOString().slice(0, 10);
  if (!isRealDate(paidOn)) return { ok: false, error: copy.form.invalidDate };

  return {
    ok: true,
    values: {
      amount,
      paid_on: paidOn,
      method:
        optionalText(formData, "paymentMethod", 60) ??
        optionalText(formData, "method", 60),
      notes:
        optionalText(formData, "paymentNotes", 1000) ??
        optionalText(formData, "notes", 1000),
      payment_kind: enumValue(
        formData,
        "paymentKind",
        PAYMENT_KINDS,
        "dp",
      ),
    },
  };
}

export async function createVendorPaymentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const weddingId = ctx.session.wedding.id;
  const vendorId = text(formData, "vendorId");
  if (!isUuid(vendorId)) return { error: ctx.copy.errors.notFound };

  const { data: vendor } = await ctx.supabase
    .from("vendors")
    .select("id, archived_at")
    .eq("id", vendorId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!vendor) return { error: ctx.copy.errors.notFound };
  if (vendor.archived_at) {
    return { error: "Vendor yang diarsipkan tidak bisa menerima pembayaran baru." };
  }

  const parsed = readPayment(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const rawKey = text(formData, "idempotencyKey");
  const idempotencyKey = isUuid(rawKey) ? rawKey : null;

  if (idempotencyKey) {
    const { data: existing } = await ctx.supabase
      .from("vendor_payments")
      .select("id")
      .eq("wedding_id", weddingId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) return { success: ctx.copy.form.saved };
  }

  const paymentId = crypto.randomUUID();
  const files = readProofFiles(formData);
  const upload = await uploadProofFiles(ctx, paymentId, files);
  if (!upload.ok) return { error: upload.error };

  const uploadedPaths = upload.proofs.map((proof) => proof.path);

  const { error } = await ctx.supabase.from("vendor_payments").insert({
    id: paymentId,
    wedding_id: weddingId,
    vendor_id: vendorId,
    ...parsed.values,
    // First file is a legacy fallback; the proof table remains authoritative.
    proof_path: upload.proofs[0]?.path ?? null,
    idempotency_key: idempotencyKey,
  });

  if (error) {
    await removeStoredFiles(ctx, uploadedPaths);
    if (error.code === "23505" && idempotencyKey) {
      return { success: ctx.copy.form.saved };
    }
    return { error: actionError(error, ctx.copy) };
  }

  if (upload.proofs.length > 0) {
    const { error: proofErrorResult } = await ctx.supabase
      .from("vendor_payment_proofs")
      .insert(
        upload.proofs.map((proof) => ({
          wedding_id: weddingId,
          payment_id: paymentId,
          path: proof.path,
          mime_type: proof.mime_type,
          original_name: proof.original_name,
          sort_order: proof.sort_order,
        })),
      );

    if (proofErrorResult) {
      // Compensate: no payment without its intended proof rows.
      await ctx.supabase
        .from("vendor_payments")
        .delete()
        .eq("id", paymentId)
        .eq("wedding_id", weddingId);
      await removeStoredFiles(ctx, uploadedPaths);
      return { error: actionError(proofErrorResult, ctx.copy) };
    }
  }

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}


export async function updateVendorPaymentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const weddingId = ctx.session.wedding.id;
  const paymentId = text(formData, "paymentId") || text(formData, "id");
  if (!isUuid(paymentId)) return { error: ctx.copy.errors.notFound };

  const { data: existing } = await ctx.supabase
    .from("vendor_payments")
    .select("id")
    .eq("id", paymentId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!existing) return { error: ctx.copy.errors.notFound };

  const parsed = readPayment(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const files = readProofFiles(formData);
  const upload = await uploadProofFiles(ctx, paymentId, files);
  if (!upload.ok) return { error: upload.error };

  const uploadedPaths = upload.proofs.map((proof) => proof.path);
  let insertedProofIds: string[] = [];

  if (upload.proofs.length > 0) {
    const { data: inserted, error: proofErrorResult } = await ctx.supabase
      .from("vendor_payment_proofs")
      .insert(
        upload.proofs.map((proof) => ({
          wedding_id: weddingId,
          payment_id: paymentId,
          path: proof.path,
          mime_type: proof.mime_type,
          original_name: proof.original_name,
          sort_order: proof.sort_order,
        })),
      )
      .select("id");

    if (proofErrorResult) {
      await removeStoredFiles(ctx, uploadedPaths);
      return { error: actionError(proofErrorResult, ctx.copy) };
    }
    insertedProofIds = (inserted ?? []).map((row) => row.id);
  }

  const { error } = await ctx.supabase
    .from("vendor_payments")
    .update(parsed.values)
    .eq("id", paymentId)
    .eq("wedding_id", weddingId);

  if (error) {
    if (insertedProofIds.length > 0) {
      await ctx.supabase
        .from("vendor_payment_proofs")
        .delete()
        .in("id", insertedProofIds)
        .eq("wedding_id", weddingId);
    }
    await removeStoredFiles(ctx, uploadedPaths);
    return { error: actionError(error, ctx.copy) };
  }

  revalidateVendorPages();
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorPaymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const weddingId = ctx.session.wedding.id;
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const [{ data: payment }, { data: proofs }] = await Promise.all([
    ctx.supabase
      .from("vendor_payments")
      .select("id, proof_path")
      .eq("id", id)
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    ctx.supabase
      .from("vendor_payment_proofs")
      .select("path")
      .eq("payment_id", id)
      .eq("wedding_id", weddingId),
  ]);

  if (!payment) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("vendor_payments")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) return { error: actionError(error, ctx.copy) };

  const paths = [
    ...(proofs ?? []).map((proof) => proof.path),
    ...(payment.proof_path ? [payment.proof_path] : []),
  ];
  await removeStoredFiles(ctx, paths);

  revalidateVendorPages();
  return null;
}

export async function deleteVendorPaymentProofAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const weddingId = ctx.session.wedding.id;
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: proof } = await ctx.supabase
    .from("vendor_payment_proofs")
    .select("id, path, payment_id")
    .eq("id", id)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!proof) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("vendor_payment_proofs")
    .delete()
    .eq("id", id)
    .eq("wedding_id", weddingId);

  if (error) return { error: actionError(error, ctx.copy) };

  // If the deleted file was also the legacy first-file fallback, clear it.
  const { data: payment } = await ctx.supabase
    .from("vendor_payments")
    .select("proof_path")
    .eq("id", proof.payment_id)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (payment?.proof_path === proof.path) {
    await ctx.supabase
      .from("vendor_payments")
      .update({ proof_path: null })
      .eq("id", proof.payment_id)
      .eq("wedding_id", weddingId);
  }

  await removeStoredFiles(ctx, [proof.path]);
  revalidateVendorPages();
  return null;
}

/** Explicit deletion of a legacy single proof_path file. */
export async function deleteLegacyPaymentProofAction(
  formData: FormData,
): Promise<void> {
  const ctx = await context();
  const weddingId = ctx.session.wedding.id;
  const paymentId = text(formData, "paymentId");
  if (!isUuid(paymentId)) return;

  const { data: payment } = await ctx.supabase
    .from("vendor_payments")
    .select("id, proof_path")
    .eq("id", paymentId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!payment?.proof_path) return;

  const { error } = await ctx.supabase
    .from("vendor_payments")
    .update({ proof_path: null })
    .eq("id", paymentId)
    .eq("wedding_id", weddingId);

  if (error) return;

  await removeStoredFiles(ctx, [payment.proof_path]);
  revalidateVendorPages();
}
