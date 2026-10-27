import type { AppLocale } from "@/lib/i18n/types";

/** [English, Bahasa Indonesia] */
type Pair = readonly [string, string];


const selectionStatus = {
  alternatif: ["Still considering", "Masih Dipikirkan"],
  terpilih: ["Chosen", "Terpilih"],
} as const;

const paymentKind = {
  dp: ["Down payment (DP)", "DP"],
  lanjutan: ["Termin Lanjutan", "Termin Lanjutan"],
  pelunasan: ["Final payment", "Pelunasan"],
} as const;

const paymentStatus = {
  diskusi: ["Discussion", "Diskusi"],
  dp: ["Down payment (DP)", "DP"],
  lunas: ["Paid off", "Lunas"],
} as const;

const bookingStatus = {
  considering: ["Considering", "Dipertimbangkan"],
  contacted: ["Contacted", "Dihubungi"],
  booked: ["Booked", "Dipesan"],
  cancelled: ["Cancelled", "Dibatalkan"],
} as const;

const rsvpStatus = {
  pending: ["Pending", "Menunggu"],
  attending: ["Attending", "Hadir"],
  not_attending: ["Not attending", "Tidak hadir"],
} as const;

const invitationStatus = {
  not_sent: ["Not sent", "Belum dikirim"],
  sent: ["Sent", "Terkirim"],
} as const;

const guestSide = {
  bride: ["Bride's side", "Pihak mempelai wanita"],
  groom: ["Groom's side", "Pihak mempelai pria"],
  unassigned: ["Unassigned", "Belum ditentukan"],
} as const;

const priority = {
  low: ["Low", "Rendah"],
  medium: ["Medium", "Sedang"],
  high: ["High", "Tinggi"],
} as const;

const taskStatus = {
  todo: ["To do", "Belum dikerjakan"],
  in_progress: ["In progress", "Sedang dikerjakan"],
  done: ["Done", "Selesai"],
} as const;

const stage = {
  planning: ["Planning", "Perencanaan"],
  "12_plus_months": ["12+ months before", "12+ bulan sebelumnya"],
  "9_to_12_months": ["9–12 months before", "9–12 bulan sebelumnya"],
  "6_to_9_months": ["6–9 months before", "6–9 bulan sebelumnya"],
  "3_to_6_months": ["3–6 months before", "3–6 bulan sebelumnya"],
  "1_to_3_months": ["1–3 months before", "1–3 bulan sebelumnya"],
  final_month: ["Final month", "Bulan terakhir"],
  wedding_week: ["Wedding week", "Minggu pernikahan"],
} as const;

const vendorCategory = {
  venue: ["Venue", "Gedung"],
  catering: ["Catering", "Katering"],
  photography: ["Photography", "Fotografi"],
  videography: ["Videography", "Videografi"],
  makeup_artist: ["Makeup artist", "Penata rias"],
  wedding_attire: ["Wedding attire", "Busana pengantin"],
  decoration: ["Decoration", "Dekorasi"],
  entertainment: ["Entertainment", "Hiburan"],
  invitations: ["Invitations", "Undangan"],
  souvenirs: ["Souvenirs", "Souvenir"],
  other: ["Other", "Lainnya"],
} as const;

const inspirationCategory = {
  wedding_dress: ["Wedding dress", "Gaun pengantin"],
  decoration: ["Decoration", "Dekorasi"],
  flowers: ["Flowers", "Bunga"],
  invitations: ["Invitations", "Undangan"],
  makeup: ["Makeup", "Tata rias"],
  venue: ["Venue", "Gedung"],
  other: ["Other", "Lainnya"],
} as const;

export const labelGroups = {
  selectionStatus,
  paymentKind,
  paymentStatus,
  bookingStatus,
  rsvpStatus,
  invitationStatus,
  guestSide,
  priority,
  taskStatus,
  stage,
  vendorCategory,
  inspirationCategory,
};

export type LabelGroup = keyof typeof labelGroups;

export function label(
  group: LabelGroup,
  key: string | null | undefined,
  locale: AppLocale,
): string {
  if (!key) return "";
  const entry = (labelGroups[group] as Record<string, Pair | undefined>)[key];
  if (!entry) return key;
  return entry[locale === "id" ? 1 : 0];
}

export function options<T extends Record<string, Pair>>(group: T) {
  return Object.keys(group).map((value) => ({ value, label: group[value] }));
}
