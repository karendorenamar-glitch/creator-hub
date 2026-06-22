"use client";

import { createClient } from "@/lib/supabase/client";
import {
  buildInvoiceStoragePath,
  INVOICE_BUCKET,
} from "@/lib/payout-invoice";

if (INVOICE_BUCKET !== "invoices") {
  throw new Error(`Invoice bucket must be exactly "invoices", got "${INVOICE_BUCKET}"`);
}

export async function uploadInvoiceFile(
  payoutId: string,
  file: File,
): Promise<{ proofUrl: string } | { error: string }> {
  console.log("UPLOAD START");
  console.log("file:", file);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { error: "Supabase project URL is not configured." };
  }

  const supabase = createClient();
  const filePath = buildInvoiceStoragePath(payoutId, file.name);

  const upload = await supabase.storage.from("invoices").upload(filePath, file);

  console.log("UPLOAD RESULT:", upload);

  if (upload.error) {
    return { error: upload.error.message };
  }

  const publicUrl = supabase.storage.from("invoices").getPublicUrl(filePath);

  console.log("PUBLIC URL:", publicUrl);

  const proofUrl = publicUrl.data.publicUrl;

  if (!proofUrl?.trim()) {
    return { error: "Failed to generate a public URL for the uploaded invoice." };
  }

  const update = await supabase
    .from("payouts")
    .update({ proof_url: proofUrl })
    .eq("id", payoutId);

  console.log("DB UPDATE RESULT:", update);

  if (update.error) {
    return { error: update.error.message };
  }

  return { proofUrl };
}
