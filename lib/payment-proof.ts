export const PAYMENT_PROOF_BUCKET = "payment-proofs";

export const ALLOWED_PAYMENT_PROOF_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const ALLOWED_PAYMENT_PROOF_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
]);

export const MAX_PAYMENT_PROOF_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function isAllowedPaymentProofFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_PAYMENT_PROOF_EXTENSIONS.has(extension)) {
    return false;
  }

  if (!file.type || file.type === "application/octet-stream") {
    return true;
  }

  return ALLOWED_PAYMENT_PROOF_MIME_TYPES.has(file.type);
}

export function isPaymentProofImageUrl(url: string) {
  const path = url.split("?")[0]?.toLowerCase() ?? "";

  return /\.(jpe?g|png|webp)$/.test(path);
}

export function isPaymentProofPdfUrl(url: string) {
  const path = url.split("?")[0]?.toLowerCase() ?? "";

  return path.endsWith(".pdf");
}

export function isPaymentProofImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return extension === "jpg" || extension === "jpeg" || extension === "png";
}

export function buildPaymentProofStoragePath(orgId: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = ALLOWED_PAYMENT_PROOF_EXTENSIONS.has(extension)
    ? extension === "jpeg"
      ? "jpg"
      : extension
    : "bin";

  return `${orgId}/${Date.now()}.${safeExtension}`;
}
