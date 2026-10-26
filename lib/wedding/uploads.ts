/**
 * Shared upload rules for wedding files. Safe to import from client components:
 * this module has no server-only or Supabase imports.
 */

export const PAYMENT_PROOF_BUCKET = "payment-proofs";
export const INSPIRATION_IMAGE_BUCKET = "inspiration-images";

export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const INSPIRATION_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const PAYMENT_PROOF_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
] as const;

export const INSPIRATION_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

export type AllowedMime =
  | (typeof PAYMENT_PROOF_TYPES)[number]
  | (typeof INSPIRATION_IMAGE_TYPES)[number];

type FileMeta = {
  name: string;
  type: string;
  size: number;
};

type Rule = {
  maxBytes: number;
  allowedTypes: readonly string[];
  allowedExtensions: Record<string, readonly string[]>;
};

const PAYMENT_PROOF_RULE: Rule = {
  maxBytes: PAYMENT_PROOF_MAX_BYTES,
  allowedTypes: PAYMENT_PROOF_TYPES,
  allowedExtensions: {
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "application/pdf": ["pdf"],
  },
};

const INSPIRATION_IMAGE_RULE: Rule = {
  maxBytes: INSPIRATION_IMAGE_MAX_BYTES,
  allowedTypes: INSPIRATION_IMAGE_TYPES,
  allowedExtensions: {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
  },
};

export type UploadValidation =
  | { ok: true; extension: string }
  | { ok: false; error: "too_large" | "invalid_type" | "invalid_extension" };

function validate(file: FileMeta, rule: Rule): UploadValidation {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: "invalid_type" };
  }
  if (file.size > rule.maxBytes) {
    return { ok: false, error: "too_large" };
  }
  if (!rule.allowedTypes.includes(file.type)) {
    return { ok: false, error: "invalid_type" };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  const allowed = rule.allowedExtensions[file.type] ?? [];
  if (!extension || !allowed.includes(extension)) {
    return { ok: false, error: "invalid_extension" };
  }

  return { ok: true, extension };
}

export function validatePaymentProofFile(
  file: FileMeta,
): UploadValidation {
  return validate(file, PAYMENT_PROOF_RULE);
}

export function validateInspirationImageFile(
  file: FileMeta,
): UploadValidation {
  return validate(file, INSPIRATION_IMAGE_RULE);
}

/** Existing WEBP files stay viewable; only new uploads are restricted. */
export function isPdfPath(path: string | null | undefined): boolean {
  return Boolean(path && path.toLowerCase().endsWith(".pdf"));
}

export function isWebpPath(path: string | null | undefined): boolean {
  return Boolean(path && path.toLowerCase().endsWith(".webp"));
}
