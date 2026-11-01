import Link from "next/link";
import { logoutDebtAction } from "@/app/debt/actions";
import { requireDebtOwner } from "@/lib/debt/auth";

const NAV = [
  ["Ringkasan", "/debt"],
  ["Akun utang", "/debt/accounts"],
  ["Pembayaran", "/debt/payments"],
] as const;

export default async function DebtPrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireDebtOwner();

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <header className="border-b border-[#e4ddcf] bg-[#fffdf8]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/debt" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-olive-700 text-sm font-semibold text-white">
              K
            </span>
            <span>
              <span className="block text-[9px] uppercase tracking-[0.24em] text-ink-soft">
                Kefoo
              </span>
              <span className="block font-heading text-lg leading-tight text-ink">
                Debt Tracker
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="hidden sm:inline">{owner.email ?? "Owner"}</span>
            <form action={logoutDebtAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-ink-soft hover:bg-olive-50 hover:text-ink"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm sm:px-6">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-full px-3 py-1.5 text-ink-soft hover:bg-olive-50 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="px-4 pb-8 text-center text-[11px] text-ink-soft/60">
        Private Debt Tracker · data hanya untuk owner yang diizinkan
      </footer>
    </div>
  );
}
