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
  isEmail,
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
  email: string | null;
  pic_internal: string | null;
  notes: string | null;
  quoted_price: number | null;
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
  const email = optionalText(formData, "email", 200);
  if (email && !isEmail(email)) {
    return { ok: false, error: copy.form.invalidEmail };
  }

  const quoted = readMoneyOrNull(formData, "quotedPrice");
  const agreed = readMoneyOrNull(formData, "agreedPrice");
  if (!quoted.ok || !agreed.ok) {
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
      email,
      pic_internal: optionalText(formData, "picInternal", 120),
      notes: optionalText(formData, "notes", 4000),
      quoted_price: quoted.value,
      agreed_price: agreed.value,
      payment_status: enumValue(
        formData,
        "paymentStatus",
        PAYMENT_STATUSES,
        "diskusi",
      ),
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

  const { error } = await ctx.supabase.from("vendors").insert({
    wedding_id: ctx.session.wedding.id,
    booking_status: enumValue(
      formData,
      "bookingStatus",
      BOOKING_STATUSES,
      "considering",
    ),
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

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

  const { error } = await ctx.supabase.from("vendor_payments").insert({
    wedding_id: ctx.session.wedding.id,
    vendor_id: vendorId,
    amount,
    paid_on: paidOn,
    method: optionalText(formData, "method", 60),
    notes: optionalText(formData, "notes", 1000),
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

  const { error } = await ctx.supabase
    .from("vendor_payments")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateVendorPages();
  return null;
}
