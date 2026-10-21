"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/get-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadWeddingSession } from "@/lib/wedding/session";

export type FormState =
  | { error?: string; success?: string; info?: string }
  | null;


function safeNext(value: string, fallback = "/wedding/dashboard") {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (!value.startsWith("/checkout") && !value.startsWith("/wedding")) {
    return fallback;
  }
  return value;
}

function withRef(path: string, ref: string) {
  if (!ref) return path;
  return `${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function messages() {
  return weddingCopy[await getLocale()];
}

function parseAmount(value: string): number | null {
  if (!value) return 0;
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function parseCount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const copy = await messages();
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email)) return { error: copy.auth.invalidEmail };
  if (!password) return { error: copy.common.genericError };

  const supabase = await createWeddingClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: copy.auth.invalidCredentials };

  revalidatePath("/wedding", "layout");
  const next = text(formData, "next");
  const safeNext =
    next.startsWith("/checkout") || next.startsWith("/wedding") ? next : null;
  redirect(safeNext ?? "/wedding/dashboard");
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const copy = await messages();
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!EMAIL_PATTERN.test(email)) return { error: copy.auth.invalidEmail };
  if (password.length < 8) return { error: copy.auth.passwordTooShort };
  if (password !== confirmPassword) return { error: copy.auth.passwordMismatch };

  const supabase = await createWeddingClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: copy.common.genericError };

  // If email confirmation is enabled there is no session yet. Send the user to
  // the sign-in screen while preserving the safe destination (no auth bypass).
  if (!data.session) {
    const next = safeNext(text(formData, "next"), "/wedding/dashboard");
    const ref = text(formData, "ref");
    redirect(
      withRef(
        `/wedding/login?next=${encodeURIComponent(next)}`,
        ref,
      ),
    );
  }

  revalidatePath("/wedding", "layout");
  const next = safeNext(text(formData, "next"), "/wedding/dashboard");
  const ref = text(formData, "ref");
  redirect(
    withRef(`/wedding/onboarding?next=${encodeURIComponent(next)}`, ref),
  );
}

export async function signOutAction() {
  const supabase = await createWeddingClient();
  await supabase.auth.signOut();
  redirect("/wedding/login");
}

export async function createWeddingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const copy = await messages();

  const partnerOne = text(formData, "partnerOne");
  const partnerTwo = text(formData, "partnerTwo");
  const weddingDate = text(formData, "weddingDate");
  const location = text(formData, "location");
  const estimatedGuests = parseCount(text(formData, "estimatedGuests"));
  const totalBudget = parseAmount(text(formData, "totalBudget"));

  if (!partnerOne) return { error: copy.onboarding.required };
  if (!partnerTwo) return { error: copy.onboarding.partnerTwoRequired };
  if (totalBudget === null) return { error: copy.onboarding.budgetInvalid };
  if (estimatedGuests === null && text(formData, "estimatedGuests")) {
    return { error: copy.onboarding.guestsInvalid };
  }

  const supabase = await createWeddingClient();
  const { error } = await supabase.rpc("create_wedding", {
    p_partner_one_name: partnerOne,
    p_partner_two_name: partnerTwo || null,
    p_wedding_date: weddingDate || null,
    p_location: location || null,
    p_estimated_guest_count: estimatedGuests,
    p_total_budget: totalBudget,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already own")) {
      redirect("/wedding/dashboard");
    }
    return { error: copy.common.genericError };
  }

  revalidatePath("/wedding", "layout");
  const next = safeNext(text(formData, "next"), "/wedding/dashboard");
  redirect(withRef(next, text(formData, "ref")));
}

export async function updateWeddingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const copy = await messages();
  const session = await loadWeddingSession();

  if (!session) redirect("/wedding/login");

  const partnerOne = text(formData, "partnerOne");
  const partnerTwo = text(formData, "partnerTwo");
  const weddingDate = text(formData, "weddingDate");
  const location = text(formData, "location");
  const notes = text(formData, "notes");
  const estimatedGuests = parseCount(text(formData, "estimatedGuests"));
  const totalBudget = parseAmount(text(formData, "totalBudget"));

  if (!partnerOne) return { error: copy.settings.partnerOneRequired };
  if (!partnerTwo) return { error: copy.onboarding.partnerTwoRequired };

  if (totalBudget === null) return { error: copy.settings.budgetInvalid };
  if (estimatedGuests === null && text(formData, "estimatedGuests")) {
    return { error: copy.settings.guestsInvalid };
  }
  if (weddingDate && Number.isNaN(new Date(weddingDate).getTime())) {
    return { error: copy.settings.dateInvalid };
  }

  const supabase = await createWeddingClient();
  const { error } = await supabase
    .from("weddings")
    .update({
      partner_one_name: partnerOne,
      partner_two_name: partnerTwo || null,
      wedding_date: weddingDate || null,
      location: location || null,
      notes: notes || null,
      estimated_guest_count: estimatedGuests,
      total_budget: totalBudget ?? 0,
    })
    .eq("id", session.wedding.id);

  if (error) return { error: copy.common.genericError };

  revalidatePath("/wedding", "layout");
  return { success: copy.settings.saved };
}
