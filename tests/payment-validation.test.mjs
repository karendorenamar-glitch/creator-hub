import {
  isRealDate,
  parseWholeRupiah,
} from "../lib/wedding/validation.ts";
import {
  INSPIRATION_IMAGE_MAX_BYTES,
  PAYMENT_PROOF_MAX_BYTES,
  validateInspirationImageFile,
  validatePaymentProofFile,
} from "../lib/wedding/uploads.ts";
import { groupProofsByPayment } from "../lib/wedding/payment-proofs.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

function file(name, type, size) {
  return { name, type, size };
}

// Amounts
t("amount plain", parseWholeRupiah("5000000"), 5_000_000);
t("amount thousand dots", parseWholeRupiah("5.000.000"), 5_000_000);
t("amount spaces", parseWholeRupiah(" 5 000 000 "), 5_000_000);
t("amount zero allowed", parseWholeRupiah("0"), 0);
t("amount zero rejected for payment", parseWholeRupiah("0", { allowZero: false }), null);
t("amount negative rejected", parseWholeRupiah("-5000"), null);
t("amount scientific rejected", parseWholeRupiah("1e6"), null);
t("amount letters rejected", parseWholeRupiah("abc"), null);
t("amount empty rejected", parseWholeRupiah(""), null);
t("amount too large rejected", parseWholeRupiah("999999999999999"), null);

// Dates
t("valid date", isRealDate("2026-10-26"), true);
t("leap day valid", isRealDate("2028-02-29"), true);
t("invalid leap day", isRealDate("2026-02-29"), false);
t("invalid month", isRealDate("2026-13-01"), false);
t("invalid format", isRealDate("26-10-2026"), false);

// Payment proofs: PNG, JPG/JPEG, PDF.
t(
  "payment png",
  validatePaymentProofFile(file("proof.png", "image/png", 1000)),
  { ok: true, extension: "png" },
);
t(
  "payment jpg",
  validatePaymentProofFile(file("proof.jpg", "image/jpeg", 1000)),
  { ok: true, extension: "jpg" },
);
t(
  "payment jpeg",
  validatePaymentProofFile(file("proof.jpeg", "image/jpeg", 1000)),
  { ok: true, extension: "jpeg" },
);
t(
  "payment pdf",
  validatePaymentProofFile(file("proof.pdf", "application/pdf", 1000)),
  { ok: true, extension: "pdf" },
);
t(
  "payment webp rejected",
  validatePaymentProofFile(file("proof.webp", "image/webp", 1000)),
  { ok: false, error: "invalid_type" },
);
t(
  "payment mismatch extension",
  validatePaymentProofFile(file("proof.png", "application/pdf", 1000)),
  { ok: false, error: "invalid_extension" },
);
t(
  "payment too large",
  validatePaymentProofFile(
    file("proof.png", "image/png", PAYMENT_PROOF_MAX_BYTES + 1),
  ),
  { ok: false, error: "too_large" },
);
t(
  "payment empty file rejected",
  validatePaymentProofFile(file("proof.png", "image/png", 0)),
  { ok: false, error: "invalid_type" },
);

// Inspiration images: JPG/JPEG/PNG only. Existing WEBP remains viewable,
// but new WEBP/PDF uploads are rejected.
t(
  "inspiration jpg",
  validateInspirationImageFile(file("photo.jpg", "image/jpeg", 1000)),
  { ok: true, extension: "jpg" },
);
t(
  "inspiration png",
  validateInspirationImageFile(file("photo.png", "image/png", 1000)),
  { ok: true, extension: "png" },
);
t(
  "inspiration webp rejected",
  validateInspirationImageFile(file("photo.webp", "image/webp", 1000)),
  { ok: false, error: "invalid_type" },
);
t(
  "inspiration pdf rejected",
  validateInspirationImageFile(file("photo.pdf", "application/pdf", 1000)),
  { ok: false, error: "invalid_type" },
);
t(
  "inspiration too large",
  validateInspirationImageFile(
    file("photo.png", "image/png", INSPIRATION_IMAGE_MAX_BYTES + 1),
  ),
  { ok: false, error: "too_large" },
);

// Proof files stay linked to their own transaction.
const grouped = groupProofsByPayment([
  { id: "a", payment_id: "pay1", path: "dp.png" },
  { id: "b", payment_id: "pay1", path: "dp.pdf" },
  { id: "c", payment_id: "pay2", path: "final.jpg" },
]);
t("proof grouping: first transaction count", grouped.pay1.length, 2);
t("proof grouping: second transaction path", grouped.pay2[0].path, "final.jpg");
t(
  "proof grouping: no cross-transaction leak",
  grouped.pay1.every((proof) => proof.payment_id === "pay1"),
  true,
);

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
