"use server";

import { createWeddingClient } from "@/lib/wedding/supabase";

export type NewPasswordState = { error?: string; ok?: boolean } | null;

export async function setAffiliatePassword(
  _prev: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const supabase = await createWeddingClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "This reset link is invalid or expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `Could not update the password (${error.message}).` };
  return { ok: true };
}
