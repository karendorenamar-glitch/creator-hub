"use server";

import { redirect } from "next/navigation";
import {
  clearActiveOrgCookie,
  createOrganizationForUser,
  setActiveOrgCookie,
} from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, isValidPhoneNumber } from "@/lib/utils";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActiveOrgCookie();
  redirect("/login");
}

export type RegisterFreeAccountInput = {
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  phoneNumber: string;
};

function validateRegisterInput(input: RegisterFreeAccountInput) {
  const email = input.email.trim();
  const workspaceName = input.workspaceName.trim();
  const phoneNumber = input.phoneNumber.trim();

  if (!workspaceName) {
    return { error: "Workspace name is required." };
  }

  if (!email) {
    return { error: "Email is required." };
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  if (!phoneNumber) {
    return { error: "Phone number is required." };
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return { error: "Enter a valid phone number." };
  }

  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (input.password !== input.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  return {
    email,
    password: input.password,
    workspaceName,
    phoneNumber,
  };
}

export type RegisterPaidPlanAccountInput = {
  name: string;
  email: string;
  password: string;
};

function validatePaidPlanRegisterInput(input: RegisterPaidPlanAccountInput) {
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) {
    return { error: "Name is required." };
  }

  if (!email) {
    return { error: "Email is required." };
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  return {
    name,
    email,
    password: input.password,
    workspaceName: name,
  };
}

export async function registerPaidPlanAccount(input: RegisterPaidPlanAccountInput) {
  const parsed = validatePaidPlanRegisterInput(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        full_name: parsed.name,
        workspace_name: parsed.workspaceName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Could not create your account. Please try again." };
  }

  if (!data.session) {
    return {
      needsEmailConfirmation: true as const,
      message:
        "Check your email to confirm your account, then return here to complete payment.",
    };
  }

  const orgResult = await createOrganizationForUser(
    data.user.id,
    parsed.workspaceName,
  );

  if (orgResult.error || !orgResult.data) {
    return {
      error:
        orgResult.error ??
        "Account created, but workspace setup failed. Try signing in again.",
    };
  }

  await setActiveOrgCookie(orgResult.data.id);

  return {
    success: true as const,
    orgId: orgResult.data.id,
  };
}

export async function registerFreeAccount(input: RegisterFreeAccountInput) {
  const parsed = validateRegisterInput(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        workspace_name: parsed.workspaceName,
        phone_number: parsed.phoneNumber,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Could not create your account. Please try again." };
  }

  if (!data.session) {
    return {
      needsEmailConfirmation: true as const,
      message:
        "Check your email to confirm your account. After confirming, sign in and your workspace will be ready.",
    };
  }

  const orgResult = await createOrganizationForUser(
    data.user.id,
    parsed.workspaceName,
  );

  if (orgResult.error || !orgResult.data) {
    return {
      error:
        orgResult.error ??
        "Account created, but workspace setup failed. Sign in and try again.",
    };
  }

  await setActiveOrgCookie(orgResult.data.id);

  return {
    success: true as const,
    orgId: orgResult.data.id,
  };
}
