import { redirect } from "next/navigation";
import { Card } from "@/components/wedding/ui";
import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";

export const metadata = { title: "Diagnosa Akun" };
export const dynamic = "force-dynamic";

/**
 * Shows the SIGNED-IN USER ONLY their own account status: which Supabase
 * project the app is talking to, their user id, and whether they are listed in
 * public.admins. No other account data is exposed.
 */
export default async function DiagnosaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/wedding/login?next=/wedding/diagnosa");

  const supabase = await createWeddingClient();

  const adminQuery = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipQuery = await supabase
    .from("wedding_members")
    .select("wedding_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdminQuery = await supabase.rpc("is_admin");

  const settingsQuery = await supabase
    .from("app_settings")
    .select("require_subscription")
    .eq("id", true)
    .maybeSingle();

  const project = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace("https://", "")
    .replace(".supabase.co", "");

  const rows: [string, string][] = [
    ["Project Supabase", project || "(kosong)"],
    ["Email login", user.email ?? "(kosong)"],
    ["User ID", user.id],
    [
      "Terdaftar sebagai admin",
      adminQuery.data ? "YA" : "TIDAK",
    ],
    [
      "Query admins",
      adminQuery.error
        ? `GAGAL: ${adminQuery.error.code} ${adminQuery.error.message}`
        : "berhasil",
    ],
    [
      "RPC is_admin()",
      isAdminQuery.error
        ? `GAGAL: ${isAdminQuery.error.code} ${isAdminQuery.error.message}`
        : String(isAdminQuery.data),
    ],
    [
      "Wedding",
      membershipQuery.data
        ? `${membershipQuery.data.wedding_id} (${membershipQuery.data.role})`
        : "belum punya",
    ],
    [
      "Query wedding_members",
      membershipQuery.error ? `GAGAL: ${membershipQuery.error.message}` : "berhasil",
    ],
    [
      "Paywall aktif",
      settingsQuery.data?.require_subscription === true
        ? "YA"
        : settingsQuery.data?.require_subscription === false
          ? "TIDAK (open access)"
          : `tidak terbaca${settingsQuery.error ? `: ${settingsQuery.error.message}` : ""}`,
    ],
  ];

  return (
    <div className="wedding-app wedding-surface min-h-screen px-4 py-10 text-cocoa sm:px-6">
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-heading text-3xl">Diagnosa Akun</h1>
        <p className="text-sm text-cocoa/60">
          Halaman ini hanya menampilkan data akun Anda sendiri. Gunakan untuk
          memeriksa mengapa <code>/admin</code> menolak akses.
        </p>

        <Card className="p-0">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-blush/50">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th className="w-2/5 px-4 py-2.5 font-medium text-cocoa/60">
                    {label}
                  </th>
                  <td className="px-4 py-2.5 break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <p className="text-xs text-cocoa/50">
          Kalau &quot;Project Supabase&quot; bukan{" "}
          <code>zvetfrrwkbzkklouwqnr</code>, berarti environment Vercel masih
          menunjuk project lama. Kalau &quot;Terdaftar sebagai admin&quot; = TIDAK,
          tambahkan user ID di atas ke tabel <code>public.admins</code>.
        </p>
      </div>
    </div>
  );
}