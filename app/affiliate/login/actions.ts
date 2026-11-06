"use server";

import { redirect } from "next/navigation";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

export type AffiliateLoginState = { error?: string } | null;

export async function loginAffiliateAction(
  _prev: AffiliateLoginState,
  formData: FormData,
): Promise<AffiliateLoginState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createWeddingClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("confirm")) {
      return { error: "This email is not confirmed yet. Check your inbox for the confirmation link." };
    }
    if (message.includes("rate") || message.includes("too many") || error.status === 429) {
      return { error: "Too many attempts. Wait a few minutes and try again." };
    }
    return { error: `Sign in failed (${error.message}).` };
  }

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("status")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (!affiliate) {
    await supabase.auth.signOut();
    return { error: "This account is not an affiliate. Please register first." };
  }
  if (affiliate.status !== "active") {
    await supabase.auth.signOut();
    return { error: "This affiliate account is suspended. Contact Kefoo." };
  }

  redirect("/affiliate/dashboard");
}
