"use server";

import {
  convertInputAmounts,
  recordFinancialEntry,
} from "@/lib/currency/action";
import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  isHttpUrl,
  isUuid,
  optionalText,
  parseWholeRupiah,
  text,
} from "@/lib/wedding/validation";
import { VENDOR_OPTION_LIMIT } from "@/lib/wedding/vendor-options";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type OptionValues = {
  category: string;
  vendor_name: string;
  instagram_url: string | null;
  reference_price: number | null;
  love_reason: string | null;
  hesitation: string | null;
};

function readOption(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: OptionValues } | { ok: false; error: string } {
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
      category: text(formData, "category").slice(0, 80) || "Lainnya",
      vendor_name: vendorName,
      instagram_url: instagramUrl,
      reference_price: referencePrice,
      love_reason: optionalText(formData, "loveReason", 2000),
      hesitation: optionalText(formData, "hesitation", 2000),
    },
  };
}

function optionError(error: { code?: string; message: string }, copy: ModuleCopy) {
  if (error.code === "23514" && error.message.includes("vendor_option_limit")) {
    return copy.vendors.optionLimit;
  }
  if (error.code === "23505") return copy.vendors.optionDuplicate;
  return actionError(error, copy);
}


function ratesError(locale: "en" | "id") {
  return locale === "en"
    ? "Exchange rates are unavailable right now. Nothing was saved; please try again shortly."
    : "Kurs mata uang sedang tidak tersedia. Belum ada yang disimpan; coba lagi sebentar lagi.";
}

export async function createVendorOptionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readOption(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { count, error: countError } = await ctx.supabase
    .from("vendor_options")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", ctx.session.wedding.id)
    .eq("category", parsed.values.category);

  if (countError) return { error: actionError(countError, ctx.copy) };
  if ((count ?? 0) >= VENDOR_OPTION_LIMIT) {
    return { error: ctx.copy.vendors.optionLimit };
  }

  const priceConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.values.reference_price ?? 0],
  );
  if (!priceConversion) return { error: ratesError(ctx.locale) };

  const { data: created, error } = await ctx.supabase
    .from("vendor_options")
    .insert({
      wedding_id: ctx.session.wedding.id,
      ...parsed.values,
      reference_price:
        parsed.values.reference_price === null ? null : priceConversion.idr[0],
    })
    .select("id")
    .single();

  if (error || !created) return { error: optionError(error ?? { message: "" }, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "vendor_option",
    recordId: created.id,
    amounts: priceConversion,
  });

  revalidateWedding("/wedding/vendors");
  return { success: ctx.copy.form.saved };
}

export async function updateVendorOptionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readOption(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const priceConversion = await convertInputAmounts(
    ctx.supabase,
    ctx.session.userId,
    [parsed.values.reference_price ?? 0],
  );
  if (!priceConversion) return { error: ratesError(ctx.locale) };

  const { error } = await ctx.supabase
    .from("vendor_options")
    .update({
      ...parsed.values,
      reference_price:
        parsed.values.reference_price === null ? null : priceConversion.idr[0],
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: optionError(error, ctx.copy) };

  await recordFinancialEntry(ctx.supabase, {
    userId: ctx.session.userId,
    module: "vendor_option",
    recordId: id,
    amounts: priceConversion,
  });

  revalidateWedding("/wedding/vendors");
  return { success: ctx.copy.form.saved };
}

export async function deleteVendorOptionAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("vendor_options")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/vendors");
  return null;
}
