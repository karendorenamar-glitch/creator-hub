"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Loader2, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { uploadInvoiceFile } from "@/lib/payout-invoice-storage";
import { isAllowedInvoiceFile, normalizeProofUrl } from "@/lib/payout-invoice";
import { cn } from "@/lib/utils";
import type { PayoutWithTiming } from "@/types/database";

type PayoutInvoiceCellProps = {
  payout: PayoutWithTiming;
};

export function PayoutInvoiceCell({ payout }: PayoutInvoiceCellProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [proofUrl, setProofUrl] = useState(() =>
    normalizeProofUrl(payout.proof_url),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);

  useEffect(() => {
    setProofUrl(normalizeProofUrl(payout.proof_url));
  }, [payout.id, payout.proof_url]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleUploadClick() {
    if (proofUrl) {
      setReplaceConfirmOpen(true);
      return;
    }

    openFilePicker();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isAllowedInvoiceFile(file)) {
      showError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadResult = await uploadInvoiceFile(payout.id, file);

      if ("error" in uploadResult) {
        showError(uploadResult.error);
        return;
      }

      const nextProofUrl = normalizeProofUrl(uploadResult.proofUrl);

      if (nextProofUrl) {
        setProofUrl(nextProofUrl);
      }

      showSuccess("Invoice uploaded.");
      router.refresh();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <div className="flex min-w-[190px] flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />

        {proofUrl ? (
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              Invoice Uploaded
            </span>
            <div className="flex items-center gap-2">
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview
              </a>
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isUploading}
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading
            ? "Uploading..."
            : proofUrl
              ? "Replace invoice"
              : "Upload invoice"}
        </button>
      </div>

      <ConfirmDialog
        open={replaceConfirmOpen}
        title="Replace invoice?"
        description="This payout already has an uploaded invoice. Uploading a new file will replace the current proof."
        confirmLabel="Replace invoice"
        onConfirm={() => {
          setReplaceConfirmOpen(false);
          openFilePicker();
        }}
        onCancel={() => setReplaceConfirmOpen(false)}
      />
    </>
  );
}
