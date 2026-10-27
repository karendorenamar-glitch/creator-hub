export const VENDOR_OPTION_CATEGORIES = [
  "Venue",
  "Dekorasi",
  "MUA",
  "Fotografi",
  "Videografi",
  "Catering",
  "Wedding Organizer",
  "Gaun Pengantin",
  "Wedding Ring",
  "Undangan",
  "Lainnya",
] as const;

export const VENDOR_OPTION_LIMIT = 5;

export type VendorOptionCategory = (typeof VENDOR_OPTION_CATEGORIES)[number];

export type VendorOptionPrefill = {
  optionId: string;
  name: string;
  category: string;
  referencePrice: number | null;
};
