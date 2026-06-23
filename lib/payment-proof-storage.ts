"use client";

import { createClient } from "@/lib/supabase/client";
import {
  buildPaymentProofStoragePath,
  PAYMENT_PROOF_BUCKET,
} from "@/lib/payment-proof";

export async function uploadPaymentProofFile(
  orgId: string,
  file: File,
): Promise<{ proofUrl: string } | { error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { error: "Supabase project URL is not configured." };
  }

  const supabase = createClient();
  const filePath = buildPaymentProofStoragePath(orgId, file.name);

  const upload = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(filePath, file);

  if (upload.error) {
    return { error: upload.error.message };
  }

  const publicUrl = supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .getPublicUrl(filePath);

  const proofUrl = publicUrl.data.publicUrl;

  if (!proofUrl?.trim()) {
    return { error: "Failed to generate a public URL for the uploaded proof." };
  }

  return { proofUrl };
}
