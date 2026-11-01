import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DebtLoginForm } from "@/components/debt/login-form";
import { logoutDebtAction } from "@/app/debt/actions";
import { getDebtOwner } from "@/lib/debt/auth";
import { getCurrentUser } from "@/lib/wedding/session";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DebtLoginPage() {
  const user = await getCurrentUser();

  if (user) {
    const owner = await getDebtOwner();
    if (owner) redirect("/debt");

    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-[#e3dccd] bg-[#fffdf8] p-7 shadow-[0_28px_80px_-52px_rgba(75,84,55,0.55)] sm:p-9">
          <p className="text-[10px] uppercase tracking-[0.28em] text-olive-700">
            Kefoo · Private ledger
          </p>
          <h1 className="mt-3 font-heading text-3xl text-ink">
            Akses belum diizinkan
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Akun <strong className="text-ink">{user.email ?? user.id}</strong>{" "}
            sudah masuk, tetapi belum terdaftar sebagai pemilik Debt Tracker.
            Hubungi admin untuk proses bootstrap owner.
          </p>
          <form action={logoutDebtAction} className="mt-6">
            <button
              type="submit"
              className="inline-flex rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
            >
              Keluar
            </button>
          </form>
          <Link
            href="/"
            className="mt-4 inline-flex text-xs text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            Kembali ke Kefoo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#e3dccd] bg-[#fffdf8] shadow-[0_28px_90px_-55px_rgba(75,84,55,0.55)] lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-olive-100 via-olive-50 to-[#efe4d2] p-9 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-olive-700 text-sm font-semibold text-white">
              K
            </span>
            <div>
              <p className="text-[9px] uppercase tracking-[0.24em] text-ink-soft">
                Kefoo
              </p>
              <p className="font-heading text-lg text-ink">Private ledger</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-olive-700">
              Personal finance
            </p>
            <h2 className="mt-3 font-heading text-4xl leading-tight text-ink">
              Tenang, terukur, dan tercatat.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Satu tempat untuk melihat sisa utang, pembayaran, dan jadwal
              berikutnya—tanpa mencampur data Kefoo Wedding Planner.
            </p>
          </div>
          <p className="text-xs leading-relaxed text-ink-soft/70">
            Halaman ini tidak diindeks mesin pencari dan tidak menyediakan
            pendaftaran publik.
          </p>
        </aside>

        <div className="p-7 sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-olive-700">
            Kefoo · Debt Tracker
          </p>
          <h1 className="mt-3 font-heading text-3xl text-ink">
            Masuk ke ledger
          </h1>
          <p className="mt-2 mb-7 text-sm leading-relaxed text-ink-soft">
            Gunakan akun Supabase yang sudah diizinkan sebagai owner.
          </p>
          <DebtLoginForm />
        </div>
      </div>
    </main>
  );
}
