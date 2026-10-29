/**
 * Single source of truth for the manual BCA transfer payment.
 * These values are intentionally public (they appear on the checkout page).
 * Never put API keys or credentials in this file.
 */
export const PAYMENT_CONFIG = {
  productName: "Wedding Planner Lifetime Access",
  productDescription:
    "Akses seumur hidup ke seluruh fitur wedding planner yang tersedia.",
  amountIdr: 30_000,
  currency: "IDR",
  method: "bank_transfer",
  bank: {
    name: "BCA",
    accountNumber: "2780205299",
    accountHolder: "Karen Dorena",
  },
  notificationEmail: "hello@kefoo.tech",
  supportEmail: "hello@kefoo.tech",
  verification: {
    title: "Harap ditunggu, pembayaran sedang diproses.",
    message:
      "Bukti transfer sudah kami terima. Tim admin akan memverifikasi pembayaranmu sebelum mengaktifkan akses.",
    hoursLabel: "Jam kerja",
    hours: "09.00 - 21.00 WIB",
    outsideHoursNote:
      "Pengajuan di luar jam kerja akan diverifikasi pada jam kerja berikutnya.",
  },
} as const;
