"use server";

import { revalidatePath } from "next/cache";
import { getOrgIdForAction } from "@/lib/org";
import {
  CHECKOUT_PLAN_CONFIG,
  isCheckoutPlan,
  type CheckoutPlan,
} from "@/lib/plan-checkout";
import { sendPaymentSubmissionNotification } from "@/lib/payment-notification-email";
import { createClient } from "@/lib/supabase/server";
import type { PaymentSubmission } from "@/types/database";

export type SubmitPlanPaymentInput = {
  plan: CheckoutPlan;
  paymentDate: string;
  senderName: string;
  proofUrl: string;
};

function getJakartaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function parsePaymentDate(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { error: "Enter a valid payment date." };
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return { error: "Enter a valid payment date." };
  }

  const today = getJakartaDateString();
  if (trimmed > today) {
    return { error: "Payment date cannot be in the future." };
  }

  return { value: trimmed };
}

export async function submitPlanPayment(input: SubmitPlanPaymentInput) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  if (!isCheckoutPlan(input.plan)) {
    return { error: "Invalid plan selected." };
  }

  const proofUrl = input.proofUrl.trim();
  if (!proofUrl) {
    return { error: "Upload your payment proof before submitting." };
  }

  const senderName = input.senderName.trim();
  if (!senderName) {
    return { error: "Name of Bank Account is required." };
  }

  const paymentDate = parsePaymentDate(input.paymentDate);
  if ("error" in paymentDate) {
    return { error: paymentDate.error };
  }

  const supabase = await createClient();

  const { data: pendingSubmission, error: pendingError } = await supabase
    .from("payment_submissions")
    .select("id")
    .eq("org_id", orgResult.orgId)
    .eq("plan", input.plan)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingError) {
    if (pendingError.message.toLowerCase().includes("payment_submissions")) {
      return {
        error:
          "Payment submissions are not set up yet. Run supabase/payment-submissions.sql in Supabase.",
      };
    }

    return { error: pendingError.message };
  }

  if (pendingSubmission) {
    return {
      error:
        "You already have a pending payment for this plan. We will review it within 1 business day.",
    };
  }

  const config = CHECKOUT_PLAN_CONFIG[input.plan];

  const { data, error } = await supabase
    .from("payment_submissions")
    .insert({
      org_id: orgResult.orgId,
      plan: input.plan,
      amount_idr: config.amountIdr,
      payment_date: paymentDate.value,
      sender_name: senderName,
      notes: null,
      proof_url: proofUrl,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  const submission = data as PaymentSubmission;

  const [
    {
      data: { user },
    },
    { data: organization },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", orgResult.orgId)
      .maybeSingle(),
  ]);

  void sendPaymentSubmissionNotification({
    submission,
    customerEmail: user?.email ?? null,
    customerName:
      typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    orgName: organization?.name ?? null,
  }).catch((notificationError) => {
    console.error("Payment notification email failed:", notificationError);
  });

  revalidatePath("/settings");
  revalidatePath(`/checkout/${input.plan}`);

  return { data: submission };
}

export async function getLatestPaymentSubmissionForOrg() {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("org_id", orgResult.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.toLowerCase().includes("payment_submissions")) {
      return { data: null };
    }

    return { error: error.message };
  }

  return { data: (data as PaymentSubmission | null) ?? null };
}
