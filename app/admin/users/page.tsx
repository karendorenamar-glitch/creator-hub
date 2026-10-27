import Link from "next/link";
import { DeleteUserButton } from "@/components/wedding/admin/delete-user-button";
import { Badge, Card } from "@/components/wedding/ui";
import { createAdminServiceClient, requireAdmin } from "@/lib/wedding/admin";
import {
  formatDateTime,
  formatIDR,
  formatWeddingDate,
} from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Admin — Users" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const NO_IDS = ["00000000-0000-0000-0000-000000000000"];

type WeddingRow = {
  id: string;
  partner_one_name: string;
  partner_two_name: string | null;
  wedding_date: string | null;
  total_budget: number;
  estimated_guest_count: number | null;
};

type PaymentSummary = {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { userId: currentAdminId } = await requireAdmin();
  const locale = await getLocale();
  const { q, page } = await searchParams;

  const search = (q ?? "").trim().toLowerCase().slice(0, 120);
  const requestedPage = Math.max(1, Number(page) || 1);

  const admin = createAdminServiceClient();
  if (!admin) {
    return (
      <Card>
        <p className="text-sm text-cocoa/70">
          SUPABASE_SERVICE_ROLE_KEY belum diatur di server, jadi daftar email
          pengguna tidak dapat dibaca.
        </p>
      </Card>
    );
  }

  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const allUsers = usersData?.users ?? [];

  const filtered = search
    ? allUsers.filter((user) =>
        (user.email ?? "").toLowerCase().includes(search),
      )
    : allUsers;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);

  const pageUsers = filtered
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const ids = pageUsers.length ? pageUsers.map((user) => user.id) : NO_IDS;
  const supabase = await createWeddingClient();

  const [{ data: memberships }, { data: payments }] = await Promise.all([
    supabase
      .from("wedding_members")
      .select("user_id, wedding_id, role")
      .in("user_id", ids),
    supabase
      .from("payments")
      .select("user_id, status, amount_idr")
      .in("user_id", ids),
  ]);

  const weddingIds = Array.from(
    new Set((memberships ?? []).map((row) => row.wedding_id)),
  );

  const [{ data: weddingRows }, { data: adminRows }] = await Promise.all([
    weddingIds.length
      ? supabase
          .from("weddings")
          .select(
            "id, partner_one_name, partner_two_name, wedding_date, total_budget, estimated_guest_count",
          )
          .in("id", weddingIds)
      : Promise.resolve({ data: [] as WeddingRow[] }),
    supabase.from("admins").select("user_id").in("user_id", ids),
  ]);

  const weddingById = new Map(
    (weddingRows ?? []).map((row) => [row.id, row as WeddingRow]),
  );
  const weddingsByUser = new Map<string, WeddingRow[]>();
  for (const row of memberships ?? []) {
    const wedding = weddingById.get(row.wedding_id);
    if (!wedding) continue;
    const list = weddingsByUser.get(row.user_id) ?? [];
    list.push(wedding);
    weddingsByUser.set(row.user_id, list);
  }

  const protectedAdminIds = new Set(
    (adminRows ?? []).map((row) => row.user_id),
  );

  const paymentsByUser = new Map<string, PaymentSummary>();
  for (const row of payments ?? []) {
    const entry = paymentsByUser.get(row.user_id) ?? {
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0,
    };
    if (row.status === "approved") {
      entry.approved += 1;
      entry.total += Number(row.amount_idr);
    }
    if (row.status === "pending_review") entry.pending += 1;
    if (row.status === "rejected") entry.rejected += 1;
    paymentsByUser.set(row.user_id, entry);
  }

  const pageHref = (next: number) =>
    `/admin/users?page=${next}${search ? `&q=${encodeURIComponent(search)}` : ""}`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Users
        </p>
        <h1 className="mt-2 font-heading text-3xl">Direktori Pengguna</h1>
        <p className="text-sm text-cocoa/60">
          {total} akun{search ? ` cocok dengan “${search}”` : ""}. Email, waktu
          daftar, login terakhir, kelengkapan wedding plan, dan pembayaran
          dibaca server-side dengan service role setelah verifikasi admin.
        </p>
      </div>

      <form action="/admin/users" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Cari email…"
          className="min-w-56 flex-1 rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
        />
        <button
          type="submit"
          className="rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa"
        >
          Cari
        </button>
        {search ? (
          <Link
            href="/admin/users"
            className="rounded-full border border-blush px-4 py-2.5 text-sm text-cocoa/65 hover:bg-blush/40"
          >
            Reset
          </Link>
        ) : null}
      </form>

      {pageUsers.length === 0 ? (
        <Card>
          <p className="text-sm text-cocoa/60">
            Tidak ada pengguna yang cocok dengan pencarian ini.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-blush/30 text-xs uppercase tracking-[0.08em] text-cocoa/55">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3">Login terakhir</th>
                <th className="px-4 py-3">Wedding plan</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush/50">
              {pageUsers.map((user) => {
                const pay = paymentsByUser.get(user.id);
                const userWeddings = weddingsByUser.get(user.id) ?? [];
                const wedding = userWeddings[0];
                const weddingDate = wedding
                  ? formatWeddingDate(wedding.wedding_date, locale)
                  : null;
                const isProtected =
                  user.id === currentAdminId || protectedAdminIds.has(user.id);

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cocoa">
                        {user.email ?? "—"}
                      </p>
                      <p className="font-mono text-[10px] text-cocoa/40">
                        {user.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-cocoa/65">
                      {formatDateTime(user.created_at, locale)}
                    </td>
                    <td className="px-4 py-3 text-cocoa/65">
                      {user.last_sign_in_at
                        ? formatDateTime(user.last_sign_in_at, locale)
                        : "Belum pernah"}
                    </td>
                    <td className="px-4 py-3 text-cocoa/80">
                      {wedding ? (
                        <div className="space-y-1">
                          <Badge tone="success">Sudah isi</Badge>
                          <p className="text-xs font-medium text-cocoa">
                            {wedding.partner_one_name}
                            {wedding.partner_two_name
                              ? ` & ${wedding.partner_two_name}`
                              : ""}
                          </p>
                          <p className="text-[11px] leading-snug text-cocoa/50">
                            {weddingDate ?? "Tanggal belum diisi"} ·{" "}
                            {formatIDR(Number(wedding.total_budget))}
                            {wedding.estimated_guest_count !== null
                              ? ` · ${wedding.estimated_guest_count} tamu`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <Badge tone="muted">Belum isi</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {pay?.approved ? (
                          <Badge tone="success">
                            {pay.approved} approved · {formatIDR(pay.total)}
                          </Badge>
                        ) : null}
                        {pay?.pending ? (
                          <Badge tone="warning">
                            {pay.pending} menunggu
                          </Badge>
                        ) : null}
                        {pay?.rejected ? (
                          <Badge tone="warning">
                            {pay.rejected} ditolak
                          </Badge>
                        ) : null}
                        {!pay ? <Badge tone="muted">belum ada</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isProtected ? (
                        <Badge tone="muted">
                          {user.id === currentAdminId ? "akun ini" : "admin"}
                        </Badge>
                      ) : (
                        <DeleteUserButton
                          userId={user.id}
                          email={user.email ?? null}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cocoa/55">
        <span>
          Halaman {currentPage} dari {pageCount} · {total} akun
        </span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="rounded-full border border-blush px-3 py-1.5 hover:bg-blush/40"
            >
              Sebelumnya
            </Link>
          ) : null}
          {currentPage < pageCount ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="rounded-full border border-blush px-3 py-1.5 hover:bg-blush/40"
            >
              Berikutnya
            </Link>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-cocoa/45">
        Daftar dibatasi 1000 akun terbaru per pembacaan. Tidak ada data
        autentikasi sensitif (password, token) yang ditampilkan. Tombol{" "}
        <strong>Hapus akun</strong> melakukan hard delete di Supabase Auth:
        wedding milik akun, membership, pembayaran, entitlement, dan file
        Storage-nya ikut dibersihkan. Akun admin dan akun yang sedang dipakai
        dilindungi.
      </p>

    </div>
  );
}
