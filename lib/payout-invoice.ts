export const INVOICE_BUCKET = "invoices";

export const ALLOWED_INVOICE_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const ALLOWED_INVOICE_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

export const MAX_INVOICE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function normalizeProofUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isAllowedInvoiceFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_INVOICE_EXTENSIONS.has(extension)) {
    return false;
  }

  if (!file.type || file.type === "application/octet-stream") {
    return true;
  }

  return ALLOWED_INVOICE_MIME_TYPES.has(file.type);
}

export function buildInvoiceStoragePath(payoutId: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = ALLOWED_INVOICE_EXTENSIONS.has(extension)
    ? extension === "jpeg"
      ? "jpg"
      : extension
    : "bin";

  return `${payoutId}/${Date.now()}.${safeExtension}`;
}

export function getInvoiceContentType(file: File) {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  return "image/jpeg";
}

export function validateInvoiceFile(file: FormDataEntryValue | null | undefined) {
  if (!(file instanceof File)) {
    return { error: "No file selected." };
  }

  if (!isAllowedInvoiceFile(file)) {
    return { error: "Only PDF, JPG, and PNG files are allowed." };
  }

  if (file.size > MAX_INVOICE_FILE_SIZE_BYTES) {
    return { error: "File must be 10 MB or smaller." };
  }

  return { file };
}
