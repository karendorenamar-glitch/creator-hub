"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/get-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/types";
import { seedLocaleFromCountry } from "@/lib/i18n/seed-locale";
import { weddingCopy } from "@/lib/wedding/copy";
import {
  createWeddingAnonymousClient,
  createWeddingClient,
} from "@/lib/wedding/supabase";
import { getCurrentUser, loadWeddingSession } from "@/lib/wedding/session";
import { isCountryCode } from "@/lib/wedding/countries";
import { MALAYSIA_STATES } from "@/lib/wedding/marriage-templates";
import { isCurrencyCode } from "@/lib/currency/currencies";
import {
  convertInputAmounts,
  submittedCurrencyIsStale,
} from "@/lib/currency/action";
import {
  loadCustomerCountry,
  saveCustomerCountry,
} from "@/lib/wedding/country";

export type FormState =
  | { error?: string; success?: string; info?: string }
  | null;


function readMalaysiaState(formData: FormData): string | null {
  const code = text(formData, "stateCode");
  return MALAYSIA_STATES.some((state) => state.code === code) ? code : null;
}

const PARTNER_NATIONALITIES = ["MY", "ID", "SG", "US", "GB", "AU"] as const;

function readPartnerNationality(formData: FormData): string | null {
  const code = text(formData, "partnerNationality");
  return (PARTNER_NATIONALITIES as readonly string[]).includes(code) ? code : null;
}

function safeNext(value: string, fallback = "/wedding/dashboard") {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (
    !value.startsWith("/checkout") &&
    !value.startsWith("/wedding") &&
    !value.startsWith("/admin")
  ) {
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

  // Keep the dashboard language aligned with the account country.
  const { data: signedIn } = await supabase.auth.getUser();
  if (signedIn.user) {
    const signedInCountry = await loadCustomerCountry(
      supabase,
      signedIn.user.id,
    );
    await seedLocaleFromCountry(signedInCountry);
  }

  revalidatePath("/wedding", "layout");
  const next = text(formData, "next");
  const safeNext =
    next.startsWith("/checkout") ||
    next.startsWith("/wedding") ||
    next.startsWith("/admin")
      ? next
      : null;
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

  const country = text(formData, "country");
  if (!isCountryCode(country)) return { error: copy.auth.countryRequired };

  // Session-less client: never send the visitor's existing cookie/token,
  // otherwise a stale session produces 401 bad_jwt.
  const supabase = createWeddingAnonymousClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Kept on the user so the country survives even when email confirmation
    // delays the customer_profiles row.
    options: { data: { country_code: country } },
  });

  if (error) {
    const message = error.message.toLowerCase();
    const code = String(error.code ?? "");
    // Server-side log only, so the real reason is visible in the terminal.
    console.error("[signUpAction]", code, error.message);

    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      code === "user_already_exists"
    ) {
      return { error: "Email ini sudah terdaftar. Silakan masuk." };
    }
    if (
      message.includes("rate") ||
      message.includes("limit") ||
      message.includes("too many") ||
      code === "429" ||
      error.status === 429
    ) {
      return {
        error:
          "Terlalu banyak percobaan pendaftaran. Tunggu beberapa menit lalu coba lagi.",
      };
    }
    if (
      message.includes("sending") ||
      message.includes("confirmation email") ||
      message.includes("smtp")
    ) {
      return {
        error:
          "Gagal mengirim email konfirmasi. Matikan “Confirm email” di Supabase atau atur SMTP, lalu coba lagi.",
      };
    }
    if (message.includes("signups not allowed") || message.includes("disabled")) {
      return {
        error: "Pendaftaran sedang ditutup. Hubungi admin.",
      };
    }
    if (message.includes("password")) {
      return { error: "Kata sandi terlalu lemah. Gunakan minimal 8 karakter." };
    }
    // Show the real reason so the founder can fix configuration quickly.
    // Supabase messages are user-facing and contain no credentials.
    const detail = error.message?.trim() || "unknown";
    return {
      error: `Pendaftaran gagal (${code || error.status || "?"}): ${detail}`,
    };
  }

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

  // signUp() above used the session-less client so a stale cookie could not
  // break the request. With autoconfirm enabled Supabase returns a session,
  // but it is in memory only. Persist it through the cookie-aware SSR client
  // before redirecting to checkout/onboarding.
  const sessionClient = await createWeddingClient();
  const { error: sessionError } = await sessionClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (sessionError) {
    console.error(
      "[signUpAction] session setup:",
      sessionError.code,
      sessionError.message,
    );
    const next = safeNext(text(formData, "next"), "/checkout");
    const ref = text(formData, "ref");
    redirect(
      withRef(
        `/wedding/login?next=${encodeURIComponent(next)}`,
        ref,
      ),
    );
  }

  if (data.user) {
    // Affiliate attribution: only runs when the visitor arrived through a
    // referral link. Failures never block the signup itself.
    try {
      const refCode = (await cookies()).get("kefoo_ref")?.value;
      if (refCode) {
        const { error: refSignIn } = await sessionClient.auth.signInWithPassword({
          email,
          password,
        });
        if (!refSignIn) {
          await sessionClient.rpc("attribute_affiliate_referral", {
            p_code: refCode,
            p_customer: data.user.id,
          });
        }
      }
    } catch (error) {
      console.error("[signUpAction] referral attribution failed", error);
    }

    await saveCustomerCountry(sessionClient, data.user.id, country).catch(
      (error: unknown) => {
        console.error("[signUpAction] country save failed", error);
        return null;
      },
    );

    // International customers onboard in English, so the dashboard must open in
    // English too. Only seed the cookie when the visitor has not chosen a
    // language explicitly.
    const cookieStore = await cookies();
    if (!cookieStore.get(LOCALE_COOKIE)) {
      cookieStore.set(LOCALE_COOKIE, country === "ID" ? "id" : "en", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  revalidatePath("/wedding", "layout");
  // Pay first: onboarding only opens after the payment is approved.
  const next = safeNext(text(formData, "next"), "/checkout");
  const ref = text(formData, "ref");
  redirect(withRef(next, ref));
}


export type CurrencyUpdateResult =
  | { ok: true; currency: string }
  | { ok: false; error: string };

/**
 * Persists the display-currency preference and nothing else. Base IDR amounts
 * are never rewritten here: the preference only changes how they render.
 *
 * Returns a result instead of redirecting so the client store can keep the
 * chosen currency, roll back on failure, and refresh without a page reload.
 */
export async function setDisplayCurrencyAction(
  nextCurrency: string,
): Promise<CurrencyUpdateResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk mengganti mata uang." };
  }

  if (!isCurrencyCode(nextCurrency)) {
    return { ok: false, error: "Mata uang tidak dikenal." };
  }

  const supabase = await createWeddingClient();
  const { error } = await supabase
    .from("customer_currency_preferences")
    .upsert(
      { user_id: user.id, display_currency: nextCurrency },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[setDisplayCurrencyAction]", error.code, error.message);
    return { ok: false, error: "Mata uang gagal disimpan. Coba lagi." };
  }

  revalidatePath("/wedding", "layout");
  return { ok: true, currency: nextCurrency };
}


/**
 * Sends a Supabase recovery email. The link always comes back to
 * /wedding/reset-password (never the Site URL landing page).
 */
export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const copy = await messages();
  const email = text(formData, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) return { error: copy.auth.invalidEmail };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kefoo.tech"
  ).replace(/\/$/, "");

  const supabase = createWeddingAnonymousClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/wedding/reset-password`,
  });

  if (error) {
    console.error("[requestPasswordResetAction]", error.code, error.message);
    const message = error.message.toLowerCase();
    if (message.includes("rate") || message.includes("limit")) {
      return { error: "Terlalu banyak permintaan. Tunggu beberapa menit." };
    }
    return { error: copy.common.genericError };
  }

  // Same message on purpose: do not reveal whether an account exists.
  return {
    info:
      "Jika email terdaftar, tautan reset sudah dikirim. Periksa inbox dan folder spam.",
  };
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
  const displayBudget = parseAmount(text(formData, "totalBudget"));

  if (!partnerOne) return { error: copy.onboarding.required };
  if (!partnerTwo) return { error: copy.onboarding.partnerTwoRequired };
  if (displayBudget === null) return { error: copy.onboarding.budgetInvalid };
  if (estimatedGuests === null && text(formData, "estimatedGuests")) {
    return { error: copy.onboarding.guestsInvalid };
  }

  const supabase = await createWeddingClient();
  const user = await getCurrentUser();
  if (!user) redirect("/wedding/login");

  if (
    await submittedCurrencyIsStale(
      supabase,
      user.id,
      text(formData, "displayCurrency"),
    )
  ) {
    return { error: copy.common.genericError };
  }


  // The typed amount is in the customer's display currency; store the IDR base.
  const budgetConversion = await convertInputAmounts(supabase, user.id, [
    displayBudget,
  ]);
  if (!budgetConversion) return { error: copy.onboarding.budgetInvalid };

  const { error } = await supabase.rpc("create_wedding", {
    p_partner_one_name: partnerOne,
    p_partner_two_name: partnerTwo || null,
    p_wedding_date: weddingDate || null,
    p_location: location || null,
    p_estimated_guest_count: estimatedGuests,
    p_total_budget: budgetConversion.idr[0],
  });

  if (error) {
    if (error.message.toLowerCase().includes("already own")) {
      redirect("/wedding/dashboard");
    }
    return { error: copy.common.genericError };
  }

  // The RPC signature predates state_code, so it is stored right after creation.
  const newStateCode = readMalaysiaState(formData);
  if (newStateCode) {
    const { error: stateError } = await supabase
      .from("weddings")
      .update({
        state_code: newStateCode,
        partner_nationality: readPartnerNationality(formData),
      })
      .eq("created_by", user.id);
    if (stateError) {
      console.error("[createWeddingAction] state save failed", stateError.message);
    }
  }

  revalidatePath("/wedding", "layout");
  redirect(withRef("/wedding/dashboard", text(formData, "ref")));
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
  const displayBudget = parseAmount(text(formData, "totalBudget"));

  if (!partnerOne) return { error: copy.settings.partnerOneRequired };
  if (!partnerTwo) return { error: copy.onboarding.partnerTwoRequired };

  if (displayBudget === null) return { error: copy.settings.budgetInvalid };
  if (estimatedGuests === null && text(formData, "estimatedGuests")) {
    return { error: copy.settings.guestsInvalid };
  }
  if (weddingDate && Number.isNaN(new Date(weddingDate).getTime())) {
    return { error: copy.settings.dateInvalid };
  }

  const supabase = await createWeddingClient();

  if (
    await submittedCurrencyIsStale(
      supabase,
      session.userId,
      text(formData, "displayCurrency"),
    )
  ) {
    return { error: copy.common.genericError };
  }

  const budgetConversion = await convertInputAmounts(
    supabase,
    session.userId,
    [displayBudget],
  );
  if (!budgetConversion) return { error: copy.settings.budgetInvalid };

  const { error } = await supabase
    .from("weddings")
    .update({
      partner_one_name: partnerOne,
      partner_two_name: partnerTwo || null,
      wedding_date: weddingDate || null,
      location: location || null,
      notes: notes || null,
      estimated_guest_count: estimatedGuests,
      total_budget: budgetConversion.idr[0],
      state_code: readMalaysiaState(formData),
      partner_nationality: readPartnerNationality(formData),
    })
    .eq("id", session.wedding.id);

  if (error) return { error: copy.common.genericError };

  revalidatePath("/wedding", "layout");
  return { success: copy.settings.saved };
}
