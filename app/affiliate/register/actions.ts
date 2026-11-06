"use server";

import { redirect } from "next/navigation";
import {
  createWeddingAnonymousClient,
  createWeddingClient,
} from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

export type AffiliateFormState = { error?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Creates the auth account and the affiliate profile, then opens the dashboard. */
export async function registerAffiliateAction(
  _prev: AffiliateFormState,
  formData: FormData,
): Promise<AffiliateFormState> {
  const fullName = text(formData, "fullName").trim().slice(0, 120);
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (fullName.length < 2) return { error: "Please enter your name." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const supabase = await createWeddingClient();

  async function createProfile(): Promise<AffiliateFormState> {
    const { error: rpcError } = await supabase.rpc("register_affiliate", {
      p_full_name: fullName,
      p_email: email,
    });

    if (rpcError) {
      console.error("[registerAffiliateAction] rpc", rpcError.code, rpcError.message);
      return {
        error: rpcError.message.includes("Already an affiliate")
          ? "This account is already an affiliate. Please sign in."
          : `Could not create the affiliate profile (${rpcError.message}).`,
      };
    }

    return null;
  }

  // Session-less signup, so a stale cookie can never attach an old account.
  const signup = createWeddingAnonymousClient();
  const { data, error } = await signup.auth.signUp({ email, password });

  if (error) {
    const already =
      error.message.toLowerCase().includes("already") ||
      error.code === "user_already_exists";

    if (!already) {
      console.error("[registerAffiliateAction]", error.code, error.message);
      return { error: `Could not create the account (${error.message}).` };
    }

    // The address may exist from an earlier attempt without a profile (for
    // example a run that failed before the RPC). Sign in and finish the job.
    const { error: retrySignIn } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (retrySignIn) {
      return { error: "This email is already registered. Please sign in." };
    }

    const retry = await createProfile();
    if (retry) return retry;
    redirect("/affiliate/dashboard");
  }

  if (!data.session) {
    return { error: "Check your email to confirm the account, then sign in." };
  }

  // signUp used a session-less client, so persist the session on the cookie
  // client before calling the RPC (auth.uid() must be present).
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    console.error("[registerAffiliateAction] sign-in", signInError.message);
    return { error: "Account created, but sign-in failed. Please sign in manually." };
  }

  const failure = await createProfile();
  if (failure) return failure;

  redirect("/affiliate/dashboard");
}
