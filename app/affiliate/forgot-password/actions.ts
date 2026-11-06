"use server";

import { createWeddingAnonymousClient } from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

export type ResetState = { error?: string; ok?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function requestAffiliatePasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = text(formData, "email").toLowerCase();
  if (!EMAIL.test(email)) return { error: "Please enter a valid email." };

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kefoo.tech").replace(/\/$/, "");
  const supabase = createWeddingAnonymousClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/affiliate/reset-password`,
  });

  if (error) {
    console.error("[affiliate reset]", error.message);
    return { error: `Could not send the reset link (${error.message}).` };
  }

  return { ok: "If that email belongs to an affiliate, a reset link is on its way." };
}
