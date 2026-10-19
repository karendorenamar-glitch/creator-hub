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
  isHttpUrl,
  isUuid,
  optionalText,
  parseMoney,
  text,
} from "@/lib/wedding/validation";

const VENDOR_CATEGORIES = [
  "venue",
  "catering",
  "photography",
  "videography",
  "makeup_artist",
  "wedding_attire",
  "decoration",
  "entertainment",
  "invitations",
  "souvenirs",
  "other",
] as const;

const BOOKING_STATUSES = [
  "considering",
  "contacted",
  "booked",
  "cancelled",
] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type VendorValues = {
  name: string;
  category: (typeof VENDOR_CATEGORIES)[number];
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  quoted_price: number | null;
  agreed_price: number | null;
  deposit_amount: number;
  amount_paid: number;
  booking_status: (typeof BOOKING_STATUSES)[number];
  payment_status: "unpaid" | "partially_paid" | "paid";
  booking_date: string | null;
  event_service_date: string | null;
  next_payment_due: string | null;
  contract_notes: string | null;
  notes: string | null;
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

function readDateOrNull(
  formData: FormData,
  key: string,
): { ok: true; value: string | null } | { ok: false } {
  const raw = text(formData, key);
  if (!raw) return { ok: true, value: null };
  if (!isDateString(raw)) return { ok: false };
  return { ok: true, value: raw };
}

function readVendor(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: VendorValues } | { ok: false; error: string } {
  const name = text(formData, "name").slice(0, 120);
  if (!name) return { ok: false, error: copy.form.required };

  const email = optionalText(formData, "email", 200);
  if (email && !isEmail(email)) {
    return { ok: false, error: copy.form.invalidEmail };
  }

  const website = optionalText(formData, "website", 500);
  if (website && !isHttpUrl(website)) {
    return { ok: false, error: copy.form.invalidUrl };
  }

  const quoted = readMoneyOrNull(formData, "quotedPrice");
  const agreed = readMoneyOrNull(formData, "agreedPrice");
  const paid = readMoneyOrNull(formData, "amountPaid");
  const deposit = readMoneyOrNull(formData, "depositAmount");

  if (!quoted.ok || !agreed.ok || !paid.ok || !deposit.ok) {
    return { ok: false, error: copy.form.invalidNumber };
  }

  const bookingDate = readDateOrNull(formData, "bookingDate");
  const serviceDate = readDateOrNull(formData, "serviceDate");
  const nextPayment = readDateOrNull(formData, "nextPaymentDue");

  if (!bookingDate.ok || !serviceDate.ok || !nextPayment.ok) {
    return { ok: false, error: copy.form.invalidDate };
  }

  const amountPaid = paid.value ?? 0;
  const referencePrice = agreed.value ?? quoted.value;
  const paymentStatus =
    referencePrice !== null && referencePrice > 0 && amountPaid >= referencePrice
      ? "paid"
      : amountPaid > 0
        ? "partially_paid"
        : "unpaid";

  return {
    ok: true,
    values: {
      name,
      category: enumValue(formData, "category", VENDOR_CATEGORIES, "other"),
      contact_name: optionalText(formData, "contactName", 120),
      phone: optionalText(formData, "phone", 40),
      email,
      website,
      quoted_price: quoted.value,
      agreed_price: agreed.value,
      deposit_amount: deposit.value ?? 0,
      amount_paid: amountPaid,
      booking_status: enumValue(
        formData,
        "bookingStatus",
        BOOKING_STATUSES,
        "considering",
      ),
      payment_status: paymentStatus,
      booking_date: bookingDate.value,
      event_service_date: serviceDate.value,
      next_payment_due: nextPayment.value,
      contract_notes: optionalText(formData, "contractNotes", 4000),
      notes: optionalText(formData, "notes", 4000),
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
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/vendors", "/wedding/budget");
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

  revalidateWedding("/wedding/vendors", "/wedding/budget");
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  // Expenses keep their wedding_id; only the vendor link is cleared (SET NULL).
  const { error } = await ctx.supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/vendors", "/wedding/budget");
  return null;
}
