import Link from "next/link";
import { Badge, Card } from "@/components/wedding/ui";
import { createAdminServiceClient, requireAdmin } from "@/lib/wedding/admin";
import { formatDateTime, formatIDR } from "@/lib/wedding/format";
import { getLocale } from "@/lib/i18n/get-locale";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Admin — Support" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const { q } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const needle = search.toLowerCase();

  const supabase = await createWeddingClient();
  const admin = createAdminServiceClient();

  if (!admin) {
    return (
      <Card>
        <p className="text-sm text-cocoa/70">
          SUPABASE_SERVICE_ROLE_KEY belum diatur, jadi pencarian berdasarkan email
          tidak tersedia.
        </p>
      </Card>
    );
  }

  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const matchedUsers = needle
    ? (usersData?.users ?? []).filter(
        (user) =>
          (user.email ?? "").toLowerCase().includes(needle) ||
          user.id.toLowerCase() === needle,
      )
    : [];

  const userIds = matchedUsers.map((user) => user.id);
  const { data: memberships } = userIds.length
    ? await supabase
        .from("wedding_members")
        .select("user_id, wedding_id, role")
        .in("user_id", userIds)
    : { data: [] };

  const weddingIds = Array.from(
    new Set((memberships ?? []).map((row) => row.wedding_id)),
  );

  const [{ data: weddings }, { data: payments }, { data: invitations }] =
    weddingIds.length
      ? await Promise.all([
          supabase.from("weddings").select("*").in("id", weddingIds),
          supabase.from("payments").select("*").in("user_id", userIds),
          supabase
            .from("invitations")
            .select("wedding_id, slug, status")
            .in("wedding_id", weddingIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const weddingById = new Map((weddings ?? []).map((w) => [w.id, w]));
  const invitationByWedding = new Map(
    (invitations ?? []).map((row) => [row.wedding_id, row]),
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rosewood">
          Support
        </p>
        <h1 className="mt-2 font-heading text-3xl">Customer Support</h1>
        <p className="text-sm text-cocoa/60">
          Lookup read-only: cari dengan email atau user ID. Tidak ada data tamu
          yang ditampilkan.
        </p>
      </div>

      <form action="/admin/support" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Email atau user ID…"
          className="min-w-56 flex-1 rounded-xl border border-blush bg-white px-3.5 py-2.5 text-sm outline-none focus:border-rosewood"
        />
        <button type="submit" className="rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory hover:bg-cocoa">
          Cari
        </button>
      </form>

      {!needle ? (
        <Card>
          <p className="text-sm text-cocoa/60">Masukkan email atau user ID untuk mulai.</p>
        </Card>
      ) : matchedUsers.length === 0 ? (
        <Card>
          <p className="text-sm text-cocoa/60">Tidak ada akun yang cocok.</p>
        </Card>
      ) : (
        matchedUsers.map((user) => {
          const userWeddings = (memberships ?? []).filter(
            (row) => row.user_id === user.id,
          );
          const userPayments = (payments ?? []).filter(
            (row) => row.user_id === user.id,
          );

          return (
            <Card key={user.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg">{user.email ?? "—"}</p>
                  <p className="font-mono text-[10px] text-cocoa/45">{user.id}</p>
                </div>
                <Link
                  href={`/admin/users?q=${encodeURIComponent(user.email ?? "")}`}
                  className="text-xs text-rosewood underline underline-offset-4"
                >
                  Buka di Users
                </Link>
              </div>

              <p className="text-xs text-cocoa/55">
                Terdaftar {formatDateTime(user.created_at, locale)} · ref kasus:{" "}
                <span className="font-mono">{user.id.slice(0, 8)}</span>
              </p>

              {userWeddings.length === 0 ? (
                <p className="text-sm text-cocoa/60">Belum memiliki wedding.</p>
              ) : (
                userWeddings.map((membership) => {
                  const wedding = weddingById.get(membership.wedding_id);
                  const invitation = invitationByWedding.get(membership.wedding_id);
                  return (
                    <div
                      key={membership.wedding_id}
                      className="rounded-xl border border-blush/60 bg-ivory p-3 text-sm"
                    >
                      <p className="font-medium">
                        {wedding
                          ? `${wedding.partner_one_name}${wedding.partner_two_name ? ` & ${wedding.partner_two_name}` : ""}`
                          : membership.wedding_id}
                        <span className="ml-2 text-xs text-cocoa/50">
                          ({membership.role})
                        </span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={wedding?.lifetime_access_granted_at ? "success" : "muted"}>
                          {wedding?.lifetime_access_granted_at ? "Lifetime" : "Tanpa lifetime"}
                        </Badge>
                        <Badge tone={invitation?.status === "published" ? "success" : "muted"}>
                          Undangan: {invitation?.status ?? "belum dibuat"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="border-t border-blush/60 pt-3">
                <p className="text-xs uppercase tracking-[0.1em] text-cocoa/45">
                  Pembayaran
                </p>
                {userPayments.length === 0 ? (
                  <p className="mt-1 text-sm text-cocoa/60">Belum ada pengajuan.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {userPayments.map((payment) => (
                      <li key={payment.id} className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{payment.reference}</span>
                        <Badge
                          tone={
                            payment.status === "approved"
                              ? "success"
                              : payment.status === "rejected"
                                ? "warning"
                                : "muted"
                          }
                        >
                          {payment.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-cocoa/55">
                          {formatIDR(payment.amount_idr)} · email {payment.email_status}
                        </span>
                        {payment.rejection_reason ? (
                          <span className="text-xs text-rose-700">
                            {payment.rejection_reason}
                          </span>
                        ) : null}
                        <Link
                          href={`/admin/payments?status=${payment.status}`}
                          className="text-xs text-rosewood underline underline-offset-4"
                        >
                          detail
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}