import type { Metadata } from "next";
import Link from "next/link";
import { PublicSeoShell } from "@/components/wedding/public-seo-shell";

const PATH = "/terms";

export const metadata: Metadata = {
  title: { absolute: "Syarat & Ketentuan | Kefoo" },
  description:
    "Syarat dan ketentuan penggunaan Kefoo Wedding Planner, termasuk akun, pembayaran, akses, dan penggunaan yang diperbolehkan.",
  alternates: { canonical: PATH },
};

export default function TermsPage() {
  return (
    <PublicSeoShell>
      <article className="mx-auto max-w-3xl px-5 py-14 text-cocoa sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Legal
        </p>
        <h1 className="mt-3 font-heading text-4xl">Syarat & Ketentuan</h1>
        <p className="mt-3 text-sm text-cocoa/55">
          Terakhir diperbarui: 27 Oktober 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-cocoa/75">
          <p>
            Dengan membuat akun atau menggunakan Kefoo, kamu menyetujui syarat
            dan ketentuan ini. Jika tidak setuju, jangan menggunakan layanan.
          </p>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Layanan</h2>
            <p>
              Kefoo menyediakan alat perencanaan pernikahan digital, termasuk
              pengelolaan anggaran, vendor, tamu, seating, checklist, inspirasi,
              dan undangan. Fitur dapat diperbarui, ditambah, atau dihentikan
              sewaktu-waktu dengan tetap memperhatikan akses yang sudah dibayar.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Akun</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Kamu wajib memberikan email yang valid dan menjaga kerahasiaan kata sandi.</li>
              <li>Satu akun digunakan untuk satu pernikahan dan dapat dihubungkan dengan pasangan.</li>
              <li>Jangan membagikan akses akun kepada pihak yang tidak berkepentingan.</li>
              <li>Kamu bertanggung jawab atas aktivitas yang terjadi melalui akunmu.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Pembayaran dan akses</h2>
            <p>
              Akses Wedding Planner Lifetime Access saat ini tersedia dengan
              pembayaran satu kali sebesar <strong>Rp30.000</strong> melalui
              transfer bank BCA. Akses diaktifkan secara manual setelah admin
              memverifikasi bukti transfer. Bukti transfer saja tidak otomatis
              membuka akses.
            </p>
            <p>
              Harga dan metode pembayaran dapat berubah untuk pembelian
              berikutnya. Perubahan tidak mengurangi akses yang sudah dibayar,
              kecuali diatur lain oleh hukum yang berlaku.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Penggunaan yang diperbolehkan</h2>
            <p>Kamu tidak boleh menggunakan Kefoo untuk:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Mengunggah konten ilegal, menyesatkan, atau melanggar hak orang lain.</li>
              <li>Mencoba mengakses akun, data, atau sistem yang bukan milikmu.</li>
              <li>Mengganggu keamanan, ketersediaan, atau integritas layanan.</li>
              <li>Menyalahgunakan data tamu atau mengirim komunikasi tanpa izin.</li>
            </ul>
          </section>


          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Data dan konten</h2>
            <p>
              Kamu tetap memiliki data pernikahan yang kamu masukkan. Kamu
              memberikan izin kepada Kefoo untuk menyimpan dan memproses data
              tersebut hanya untuk menjalankan layanan. Kamu bertanggung jawab
              memastikan data tamu dan konten yang diunggah tidak melanggar hak
              pihak lain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Ketersediaan layanan</h2>
            <p>
              Kami berupaya menjaga layanan tetap tersedia, tetapi tidak
              menjamin layanan bebas gangguan sepenuhnya. Pemeliharaan,
              gangguan penyedia infrastruktur, atau keadaan di luar kendali
              dapat menyebabkan downtime sementara.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Pembatasan tanggung jawab</h2>
            <p>
              Kefoo adalah alat bantu perencanaan. Keputusan akhir mengenai
              vendor, anggaran, kontrak, dan pernikahan tetap menjadi tanggung
              jawab pengguna. Sepanjang diizinkan hukum, Kefoo tidak bertanggung
              jawab atas kerugian tidak langsung yang timbul dari penggunaan
              layanan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Penghentian akun</h2>
            <p>
              Kami dapat menangguhkan atau menghentikan akun yang melanggar
              ketentuan ini, menyalahgunakan layanan, atau menimbulkan risiko
              keamanan. Kamu dapat meminta penghapusan akun melalui email di
              bawah.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Perubahan dan hukum</h2>
            <p>
              Syarat ini dapat diperbarui dan versi terbaru dipublikasikan di
              halaman ini. Syarat ini diatur oleh hukum yang berlaku di
              Indonesia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Kontak</h2>
            <p>
              Pertanyaan tentang syarat ini dapat dikirim ke{" "}
              <a
                href="mailto:hello@kefoo.tech"
                className="font-medium text-rosewood underline underline-offset-4"
              >
                hello@kefoo.tech
              </a>
              .
            </p>
          </section>

          <p className="border-t border-blush/60 pt-5 text-sm text-cocoa/55">
            Lihat juga{" "}
            <Link href="/privacy" className="text-rosewood underline underline-offset-4">
              Kebijakan Privasi
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
