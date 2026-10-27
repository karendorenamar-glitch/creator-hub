import type { Metadata } from "next";
import Link from "next/link";
import { PublicSeoShell } from "@/components/wedding/public-seo-shell";

const PATH = "/privacy";

export const metadata: Metadata = {
  title: { absolute: "Kebijakan Privasi | Kefoo" },
  description:
    "Kebijakan privasi Kefoo: data apa yang disimpan, bagaimana data digunakan, dan cara meminta penghapusan akun.",
  alternates: { canonical: PATH },
};

export default function PrivacyPage() {
  return (
    <PublicSeoShell>
      <article className="mx-auto max-w-3xl px-5 py-14 text-cocoa sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Legal
        </p>
        <h1 className="mt-3 font-heading text-4xl">Kebijakan Privasi</h1>
        <p className="mt-3 text-sm text-cocoa/55">
          Terakhir diperbarui: 27 Oktober 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-cocoa/75">
          <p>
            Kefoo adalah wedding planner digital untuk membantu pasangan
            mengelola anggaran, vendor, tamu, checklist, dan undangan. Kebijakan
            ini menjelaskan data apa yang kami simpan dan bagaimana data tersebut
            digunakan.
          </p>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Data yang disimpan</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Email dan data autentikasi akun.</li>
              <li>
                Data pernikahan yang kamu isi, seperti nama pasangan, tanggal,
                lokasi, target anggaran, vendor, tamu, checklist, dan undangan.
              </li>
              <li>
                Bukti pembayaran dan data transaksi yang diperlukan untuk
                verifikasi akses.
              </li>
              <li>
                Data tamu yang kamu masukkan. Kamu bertanggung jawab memastikan
                kamu berhak menyimpan dan menggunakan data tamu tersebut.
              </li>
              <li>
                Log teknis terbatas yang diperlukan untuk keamanan, diagnostik,
                dan ketersediaan layanan.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Penggunaan data</h2>
            <p>
              Data digunakan untuk menyediakan fitur Kefoo, menyimpan pekerjaan
              perencanaanmu, memverifikasi pembayaran, memberikan dukungan, dan
              menjaga keamanan layanan. Kami tidak menjual data pribadi kepada
              pihak ketiga.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Penyimpanan dan pihak ketiga</h2>
            <p>
              Kefoo menggunakan penyedia infrastruktur tepercaya, termasuk
              Supabase untuk database, autentikasi, dan penyimpanan file, Vercel
              untuk hosting, serta layanan email untuk notifikasi transaksi.
              Data dapat diproses di luar Indonesia sesuai infrastruktur
              penyedia tersebut.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Akses dan retensi</h2>
            <p>
              Data pernikahan hanya dapat diakses oleh anggota akun yang
              bersangkutan. Admin Kefoo dapat mengakses data terbatas untuk
              keperluan dukungan, verifikasi pembayaran, dan keamanan. Data
              disimpan selama akun aktif atau sesuai kebutuhan operasional.
              Kamu dapat meminta penghapusan akun dan data melalui email di
              bawah.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Cookie</h2>
            <p>
              Kefoo menggunakan cookie sesi yang diperlukan untuk login dan
              menjaga keamanan akun. Kefoo tidak menggunakan cookie iklan pihak
              ketiga.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Hak dan pertanyaan</h2>
            <p>
              Kamu dapat meminta salinan, koreksi, atau penghapusan data dengan
              menghubungi{" "}
              <a
                href="mailto:hello@kefoo.tech"
                className="font-medium text-rosewood underline underline-offset-4"
              >
                hello@kefoo.tech
              </a>
              . Kami dapat meminta verifikasi identitas sebelum memproses
              permintaan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Perubahan kebijakan</h2>
            <p>
              Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru akan
              dipublikasikan di halaman ini beserta tanggal pembaruannya.
            </p>
          </section>

          <p className="border-t border-blush/60 pt-5 text-sm text-cocoa/55">
            Lihat juga{" "}
            <Link href="/terms" className="text-rosewood underline underline-offset-4">
              Syarat & Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="/refund" className="text-rosewood underline underline-offset-4">
              Kebijakan Refund
            </Link>
            .
          </p>
        </div>
      </article>
    </PublicSeoShell>
  );
}
