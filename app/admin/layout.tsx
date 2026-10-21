import Link from "next/link";

import { BrandLogo } from "@/components/wedding/brand-logo";
import { requireAdmin } from "@/lib/wedding/admin";
import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { signOutAction } from "@/app/wedding/actions";

const NAV = [
  ["Overview", "/admin"],
  ["Payments", "/admin/payments"],
  ["Users", "/admin/users"],
  ["Weddings", "/admin/weddings"],
  ["Support", "/admin/support"],
];

export const metadata = { title: "Admin — Kefoo" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const user = await getCurrentUser();

  // Admins who are also wedding members keep their normal dashboard link.
  let hasWedding = false;
  if (user) {
    const supabase = await createWeddingClient();
    const { data } = await supabase
      .from("wedding_members")
      .select("wedding_id")
      .eq("user_id", user.id)
      .maybeSingle();
    hasWedding = Boolean(data);
  }

  return (
    <div className="wedding-app wedding-surface min-h-screen text-cocoa">
      <header className="border-b border-blush/60 bg-ivory/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="rounded-full bg-blush/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cocoa/70">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {hasWedding ? (
              <Link
                href="/wedding/dashboard"
                className="rounded-full border border-blush px-3 py-1.5 text-cocoa/70 hover:bg-blush/40"
              >
                Dashboard wedding
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-cocoa/60 hover:bg-blush/40"
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
              className="shrink-0 rounded-full px-3 py-1.5 text-cocoa/65 hover:bg-blush/40 hover:text-cocoa"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="px-4 pb-8 text-center text-xs text-cocoa/40">
        Masuk sebagai {admin.email ?? admin.userId}
      </footer>
    </div>
  );
}
