/**
 * Country (and Malaysian state) specific marriage administration templates.
 *
 * The database stores a snapshot of the generated items per wedding, so editing
 * a template never rewrites an existing checklist. New generations must use a
 * new template key.
 */

export type ChecklistKind = "builtin_kua" | "builtin_my" | "builtin_generic";

export type MarriageStage = "planning" | "final_month";

export type MarriageTemplateItem = {
  key: string;
  group: string;
  title: string;
  stage: MarriageStage;
  /** Extra guidance shown as the item description (unverified requirements). */
  note?: string;
};

export type MarriageTemplate = {
  key: string;
  kind: ChecklistKind;
  country: "ID" | "MY" | "INTL";
  title: (year: number) => string;
  groups: string[];
  items: MarriageTemplateItem[];
};

export type MalaysiaStateCode =
  | "JHR" | "SGR" | "KUL" | "NSN" | "MLK" | "PRK" | "KDH"
  | "PLS" | "TRG" | "KTN" | "PHG" | "PNG" | "SBH" | "SWK";

export type MalaysiaStateConfig = {
  code: MalaysiaStateCode;
  name: string;
  authority: string;
};

/**
 * Religious authorities per state. Online systems are intentionally NOT listed:
 * SPPIM is not used uniformly, and this app does not assert which state uses
 * which portal. Every process item points the customer to the state office.
 */
export const MALAYSIA_STATES: MalaysiaStateConfig[] = [
  { code: "JHR", name: "Johor", authority: "Jabatan Agama Islam Johor" },
  { code: "SGR", name: "Selangor", authority: "Jabatan Agama Islam Selangor" },
  { code: "KUL", name: "Kuala Lumpur / Wilayah Persekutuan", authority: "Jabatan Agama Islam Wilayah Persekutuan" },
  { code: "NSN", name: "Negeri Sembilan", authority: "Jabatan Agama Islam Negeri Sembilan" },
  { code: "MLK", name: "Melaka", authority: "Jabatan Agama Islam Melaka" },
  { code: "PRK", name: "Perak", authority: "Jabatan Agama Islam Perak" },
  { code: "KDH", name: "Kedah", authority: "Jabatan Agama Islam Kedah" },
  { code: "PLS", name: "Perlis", authority: "Jabatan Agama Islam Perlis" },
  { code: "TRG", name: "Terengganu", authority: "Jabatan Agama Islam Terengganu" },
  { code: "KTN", name: "Kelantan", authority: "Jabatan Agama Islam Kelantan" },
  { code: "PHG", name: "Pahang", authority: "Jabatan Agama Islam Pahang" },
  { code: "PNG", name: "Pulau Pinang", authority: "Jabatan Agama Islam Pulai Pinang" },
  { code: "SBH", name: "Sabah", authority: "Jabatan Hal Ehwal Agama Islam Negeri Sabah" },
  { code: "SWK", name: "Sarawak", authority: "Jabatan Agama Islam Sarawak" },
];

export const VERIFY_WITH_STATE_OFFICE =
  "Sila semak dengan Pejabat Agama Negeri";

// The Indonesian KUA snapshot is re-exported through the registry instead of
// being copied, so its 24 existing items and keys stay byte-for-byte identical.
export { KUA_TEMPLATE } from "./kua-checklist";

import {
  KUA_TEMPLATE as KUA_ITEMS,
  KUA_TEMPLATE_GROUPS,
  KUA_TEMPLATE_KEY,
  kuaChecklistTitle,
} from "./kua-checklist";

export const INDONESIA_TEMPLATE: MarriageTemplate = {
  key: KUA_TEMPLATE_KEY,
  kind: "builtin_kua",
  country: "ID",
  title: kuaChecklistTitle,
  groups: KUA_TEMPLATE_GROUPS,
  items: KUA_ITEMS.map((item) => ({
    key: item.key,
    group: item.group,
    title: item.title,
    stage: item.stage,
  })),
};

export const MALAYSIA_TEMPLATE_KEY = "my_v1";
export const GENERIC_TEMPLATE_KEY = "intl_v1";

const MY_GROUPS = [
  "A. Sebelum Permohonan Nikah",
  "B. Dokumen Permohonan Kebenaran Berkahwin",
  "C. Permohonan Kebenaran Berkahwin",
  "D. Persiapan Akad Nikah",
  "E. Selepas Akad Nikah",
  "Dokumen Pasangan Warga Asing",
] as const;

type MyGroup = (typeof MY_GROUPS)[number];

function my(
  key: string,
  group: MyGroup,
  title: string,
  note?: string,
  stage: MarriageStage = "planning",
): MarriageTemplateItem {
  return { key: `my_v1_${key}`, group, title, stage, ...(note ? { note } : {}) };
}

function malaysiaItems(state: MalaysiaStateConfig | null): MarriageTemplateItem[] {
  const office = state?.authority ?? "Pejabat Agama Negeri";
  const a = MY_GROUPS[0];
  const b = MY_GROUPS[1];
  const c = MY_GROUPS[2];
  const d = MY_GROUPS[3];
  const e = MY_GROUPS[4];

  return [
    my("a1", a, "Tentukan negeri dan daerah tempat permohonan nikah.", state ? `Negeri dipilih: ${state.name}.` : VERIFY_WITH_STATE_OFFICE),
    my("a2", a, "Tentukan status perkahwinan (bujang / duda / janda)."),
    my("a3", a, "Semak syarat permohonan nikah negeri masing-masing.", `${VERIFY_WITH_STATE_OFFICE} (${office}).`),
    my("a4", a, "Hadiri kursus praperkahwinan jika diwajibkan.", VERIFY_WITH_STATE_OFFICE),
    my("a5", a, "Dapatkan sijil kursus praperkahwinan."),
    my("a6", a, "Jalani ujian saringan HIV jika diwajibkan.", VERIFY_WITH_STATE_OFFICE),
    my("a7", a, "Sediakan gambar berukuran pasport."),

    my("b1", b, "Salinan MyKad calon suami."),
    my("b2", b, "Salinan MyKad calon isteri."),
    my("b3", b, "Sijil kursus praperkahwinan."),
    my("b4", b, "Keputusan ujian HIV (jika diwajibkan)."),
    my("b5", b, "Pengesahan status bujang / surat akuan bujang."),
    my("b6", b, "Dokumen wali dan maklumat wali."),
    my("b7", b, "Surat cerai (jika duda / janda)."),
    my("b8", b, "Sijil kematian pasangan terdahulu (jika balu / duda)."),
    my("b9", b, "Gambar berukuran pasport."),
    my("b10", b, "Dokumen tambahan yang ditetapkan oleh pejabat agama negeri.", `${VERIFY_WITH_STATE_OFFICE} (${office}).`),

    my("c1", c, "Semak kaedah permohonan dalam talian yang digunakan negeri anda.", `Sebahagian negeri menggunakan portal SPPIM; ${VERIFY_WITH_STATE_OFFICE} (${office}).`),
    my("c2", c, "Isi borang permohonan kebenaran berkahwin."),
    my("c3", c, "Lengkapkan maklumat calon suami dan isteri."),
    my("c4", c, "Lengkapkan maklumat wali."),
    my("c5", c, "Muat naik dokumen sokongan."),
    my("c6", c, "Semak senarai dokumen mengikut negeri.", VERIFY_WITH_STATE_OFFICE),
    my("c7", c, "Cetak borang permohonan jika diperlukan."),
    my("c8", c, "Hantar permohonan kepada pejabat agama yang berkenaan.", `Hantar kepada ${office}.`),
    my("c9", c, "Dapatkan kelulusan kebenaran berkahwin."),

    my("d1", d, "Tetapkan tarikh akad nikah.", undefined, "final_month"),
    my("d2", d, "Tetapkan lokasi akad nikah.", undefined, "final_month"),
    my("d3", d, "Uruskan jurunikah.", undefined, "final_month"),
    my("d4", d, "Sahkan wali dan saksi.", undefined, "final_month"),
    my("d5", d, "Sediakan mas kahwin mengikut ketetapan negeri.", `${VERIFY_WITH_STATE_OFFICE} (${office}).`, "final_month"),
    my("d6", d, "Sediakan dokumen kelulusan nikah.", undefined, "final_month"),
    my("d7", d, "Sahkan keperluan tambahan dengan pejabat agama.", undefined, "final_month"),

    my("e1", e, "Pastikan perkahwinan didaftarkan."),
    my("e2", e, "Lengkapkan dokumen pendaftaran nikah."),
    my("e3", e, "Dapatkan Sijil Nikah."),
    my("e4", e, "Simpan salinan digital dan fizikal Sijil Nikah."),
  ];
}

const INTL_GROUPS = [
  "Documents",
  "Application",
  "Ceremony",
  "After the ceremony",
] as const;

type IntlGroup = (typeof INTL_GROUPS)[number];

function intl(key: string, group: IntlGroup, title: string, note?: string): MarriageTemplateItem {
  return {
    key: `intl_v1_${key}`,
    group,
    title,
    stage: group === "After the ceremony" ? "final_month" : "planning",
    ...(note ? { note } : {}),
  };
}

export const INTERNATIONAL_TEMPLATE: MarriageTemplate = {
  key: GENERIC_TEMPLATE_KEY,
  kind: "builtin_generic",
  country: "INTL",
  title: (year) => `Marriage requirements checklist ${year}`,
  groups: [...INTL_GROUPS],
  items: [
    intl("a1", INTL_GROUPS[0], "Confirm the authority that registers marriages in your country or city."),
    intl("a2", INTL_GROUPS[0], "Passports or national identity documents for both partners."),
    intl("a3", INTL_GROUPS[0], "Birth certificates for both partners."),
    intl("a4", INTL_GROUPS[0], "Proof of single status, or divorce / death certificate if previously married."),
    intl("a5", INTL_GROUPS[0], "Residency permits or visas, where applicable."),
    intl("a6", INTL_GROUPS[1], "Complete the marriage licence or notice-of-intent application."),
    intl("a7", INTL_GROUPS[1], "Certified translations of documents not in the local language."),
    intl("a8", INTL_GROUPS[1], "Prenuptial agreement or statutory declaration, if required."),
    intl("a9", INTL_GROUPS[2], "Book the officiant, venue and required witnesses."),
    intl("a10", INTL_GROUPS[2], "Confirm the ceremony requirements with the local authority."),
    intl("a11", INTL_GROUPS[3], "Register the marriage and obtain the certificate."),
    intl("a12", INTL_GROUPS[3], "Store digital and physical copies of the certificate."),
  ],
};

/** Pick the template that matches the customer, defaulting to international. */
export function resolveMarriageTemplate({
  country,
  stateCode,
}: {
  country: string | null;
  stateCode?: string | null;
}): MarriageTemplate {
  if (country === "ID") return INDONESIA_TEMPLATE;
  if (country === "MY") {
    const state = MALAYSIA_STATES.find((item) => item.code === stateCode) ?? null;
    return {
      key: MALAYSIA_TEMPLATE_KEY,
      kind: "builtin_my",
      country: "MY",
      title: (year) => `Urusan Perkahwinan Islam Malaysia ${year}`,
      groups: [...MY_GROUPS],
      items: malaysiaItems(state),
    };
  }
  return INTERNATIONAL_TEMPLATE;
}

/** Extra group for couples where one partner is a foreign national. */
export function foreignPartnerItems(): MarriageTemplateItem[] {
  const g = "Dokumen Pasangan Warga Asing";
  return [
    my("f1", g, "Passport pasangan warga asing."),
    my("f2", g, "Bukti status perkahwinan / surat akuan bujang dari negara asal."),
    my("f3", g, "Dokumen kedutaan atau konsulat yang berkaitan."),
    my("f4", g, "Dokumen imigresen, jika berkenaan."),
    my("f5", g, "Dokumen yang ditetapkan oleh pihak agama negeri.", VERIFY_WITH_STATE_OFFICE),
    my("f6", g, "Terjemahan bertauliah, jika diperlukan."),
    my("f7", g, "Kebenaran atau kelulusan tambahan, jika berkenaan.", VERIFY_WITH_STATE_OFFICE),
  ];
}
