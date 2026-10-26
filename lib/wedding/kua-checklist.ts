/**
 * Stable snapshot source for the built-in KUA checklist.
 *
 * The database stores these titles/groups as task rows. Editing this template
 * later must not rewrite an existing wedding snapshot. Use a new template key
 * if the source content needs a materially different generation.
 */

export const KUA_TEMPLATE_KEY = "kua_v1";

export type KuaTemplateGroup =
  | "Dokumen dasar calon pengantin"
  | "Dokumen wali dan saksi"
  | "Dokumen tambahan jika berlaku"
  | "Sebelum hari akad";

export type KuaTemplateItem = {
  key: string;
  group: KuaTemplateGroup;
  title: string;
  stage: "planning" | "final_month";
};

export const KUA_TEMPLATE: KuaTemplateItem[] = [
  {
    key: "kua_v1_a1",
    group: "Dokumen dasar calon pengantin",
    title: "Fotokopi KTP calon suami",
    stage: "planning",
  },
  {
    key: "kua_v1_a2",
    group: "Dokumen dasar calon pengantin",
    title: "Fotokopi KTP calon istri",
    stage: "planning",
  },
  {
    key: "kua_v1_a3",
    group: "Dokumen dasar calon pengantin",
    title: "Fotokopi Kartu Keluarga (KK)",
    stage: "planning",
  },
  {
    key: "kua_v1_a4",
    group: "Dokumen dasar calon pengantin",
    title: "Fotokopi akta kelahiran atau surat keterangan lahir",
    stage: "planning",
  },
  {
    key: "kua_v1_a5",
    group: "Dokumen dasar calon pengantin",
    title: "Pas foto latar biru sesuai ukuran dan jumlah yang diminta KUA",
    stage: "planning",
  },
  {
    key: "kua_v1_a6",
    group: "Dokumen dasar calon pengantin",
    title:
      "Surat pengantar nikah dari desa/kelurahan (Model N1, atau formulir yang berlaku saat ini)",
    stage: "planning",
  },
  {
    key: "kua_v1_a7",
    group: "Dokumen dasar calon pengantin",
    title:
      "Formulir pendaftaran/kehendak nikah dan persetujuan kedua calon pengantin",
    stage: "planning",
  },
  {
    key: "kua_v1_a8",
    group: "Dokumen dasar calon pengantin",
    title:
      "Surat keterangan sehat jika diminta oleh KUA/fasilitas kesehatan setempat",
    stage: "planning",
  },
  {
    key: "kua_v1_b1",
    group: "Dokumen wali dan saksi",
    title: "Data serta fotokopi KTP wali nikah",
    stage: "planning",
  },
  {
    key: "kua_v1_b2",
    group: "Dokumen wali dan saksi",
    title: "Data dua orang saksi nikah",
    stage: "planning",
  },
  {
    key: "kua_v1_b3",
    group: "Dokumen wali dan saksi",
    title: "Dokumen pendukung wali sesuai kondisi, jika diminta KUA",
    stage: "planning",
  },
  {
    key: "kua_v1_b4",
    group: "Dokumen wali dan saksi",
    title:
      "Dokumen taukil/wakalah wali jika wali tidak hadir dan perwakilan diperlukan",
    stage: "planning",
  },
  {
    key: "kua_v1_c1",
    group: "Dokumen tambahan jika berlaku",
    title:
      "Surat rekomendasi nikah dari KUA asal jika menikah di luar kecamatan tempat tinggal",
    stage: "planning",
  },
  {
    key: "kua_v1_c2",
    group: "Dokumen tambahan jika berlaku",
    title: "Izin orang tua jika usia calon pengantin belum 21 tahun",
    stage: "planning",
  },
  {
    key: "kua_v1_c3",
    group: "Dokumen tambahan jika berlaku",
    title:
      "Dispensasi Pengadilan Agama jika usia calon pengantin di bawah ketentuan minimum",
    stage: "planning",
  },
  {
    key: "kua_v1_c4",
    group: "Dokumen tambahan jika berlaku",
    title: "Akta cerai jika berstatus cerai hidup",
    stage: "planning",
  },
  {
    key: "kua_v1_c5",
    group: "Dokumen tambahan jika berlaku",
    title:
      "Akta kematian pasangan jika berstatus duda/janda karena pasangan meninggal",
    stage: "planning",
  },
  {
    key: "kua_v1_c6",
    group: "Dokumen tambahan jika berlaku",
    title: "Izin atasan/kesatuan bagi anggota TNI/Polri jika diwajibkan",
    stage: "planning",
  },
  {
    key: "kua_v1_c7",
    group: "Dokumen tambahan jika berlaku",
    title: "Dokumen pengadilan untuk kondisi khusus, jika berlaku",
    stage: "planning",
  },
  {
    key: "kua_v1_d1",
    group: "Sebelum hari akad",
    title: "Daftar melalui SIMKAH atau langsung ke KUA",
    stage: "final_month",
  },
  {
    key: "kua_v1_d2",
    group: "Sebelum hari akad",
    title: "Pastikan berkas sudah diverifikasi KUA",
    stage: "final_month",
  },
  {
    key: "kua_v1_d3",
    group: "Sebelum hari akad",
    title: "Ikuti bimbingan perkawinan (Bimwin) sesuai arahan KUA",
    stage: "final_month",
  },
  {
    key: "kua_v1_d4",
    group: "Sebelum hari akad",
    title: "Konfirmasi tanggal, jam, wali, saksi, dan lokasi akad",
    stage: "final_month",
  },
  {
    key: "kua_v1_d5",
    group: "Sebelum hari akad",
    title: "Siapkan dokumen asli untuk pemeriksaan petugas",
    stage: "final_month",
  },
];

export const KUA_TEMPLATE_GROUPS: KuaTemplateGroup[] = [
  "Dokumen dasar calon pengantin",
  "Dokumen wali dan saksi",
  "Dokumen tambahan jika berlaku",
  "Sebelum hari akad",
];

export function kuaChecklistTitle(year: number): string {
  return `Checklist berdasarkan KUA tahun ${year}`;
}
