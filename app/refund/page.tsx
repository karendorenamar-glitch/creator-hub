import type { Metadata } from "next";
import Link from "next/link";
import { PublicSeoShell } from "@/components/wedding/public-seo-shell";

const PATH = "/refund";

export const metadata: Metadata = {
  title: { absolute: "Kebijakan Refund | Kefoo" },
  description:
    "Kebijakan pengembalian dana Kefoo untuk pembelian Wedding Planner Lifetime Access.",
  alternates: { canonical: PATH },
};

export default function RefundPage() {
  return (
    <PublicSeoShell>
      <article className="mx-auto max-w-3xl px-5 py-14 text-cocoa sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Legal
        </p>
        <h1 className="mt-3 font-heading text-4xl">Kebijakan Refund</h1>
        <p className="mt-3 text-sm text-cocoa/55">
          Terakhir diperbarui: 27 Oktober 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-cocoa/75">
          <p>
            Kefoo menjual akses digital <strong>Wedding Planner Lifetime
            Access</strong> sebesar Rp30.000. Pembayaran dilakukan melalui
            transfer bank dan diverifikasi manual oleh admin.
          </p>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Kapan refund dapat diajukan</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Pembayaran dilakukan dua kali atau nominal yang ditransfer
                melebihi harga yang berlaku.
              </li>
              <li>
                Pembayaran sudah terverifikasi, tetapi akses akun tidak aktif
                karena kesalahan teknis di sisi Kefoo.
              </li>
              <li>
                Layanan tidak dapat digunakan secara material dan masalah tidak
                dapat diselesaikan dalam waktu yang wajar.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Kapan refund tidak otomatis diberikan</h2>
            <p>
              Karena akses digital langsung dapat digunakan setelah aktivasi,
              refund tidak otomatis diberikan hanya karena perubahan rencana
              pernikahan, akun tidak lagi dibutuhkan, atau fitur yang tidak
              termasuk dalam layanan. Pengajuan tetap dapat ditinjau secara
              wajar.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Cara mengajukan</h2>
            <p>
              Kirim email ke{" "}
              <a
                href="mailto:hello@kefoo.tech"
                className="font-medium text-rosewood underline underline-offset-4"
              >
                hello@kefoo.tech
              </a>{" "}
              dengan subjek <strong>Refund Kefoo</strong>, sertakan:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Email akun Kefoo.</li>
              <li>Referensi pembayaran atau tanggal transfer.</li>
              <li>Nama pemilik rekening pengirim dan nominal.</li>
              <li>Alasan pengajuan dan bukti pendukung bila ada.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Proses</h2>
            <p>
              Kami akan memeriksa data pembayaran dan status akses. Jika refund
              disetujui, dana dikembalikan ke rekening asal setelah verifikasi.
              Waktu proses dapat berbeda tergantung bank, umumnya beberapa hari
              kerja.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-2xl text-cocoa">Kontak</h2>
            <p>
              Pertanyaan tentang kebijakan ini dapat dikirim ke{" "}
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
            <Link href="/terms" className="text-rosewood underline underline-offset-4">
              Syarat & Ketentuan
            </Link>
            .
          </p>
        </div>
      </article>
    </PublicSeoShell>
  );
}
