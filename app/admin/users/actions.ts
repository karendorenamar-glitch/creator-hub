"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminServiceClient,
  requireAdmin,
} from "@/lib/wedding/admin";
import { text } from "@/lib/wedding/validation";

export type DeleteUserResult = { error?: string; success?: string } | null;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Hard-delete an account from Supabase Auth and remove its workspace data.
 *
 * The database FKs cascade most rows, but we delete the owned wedding and the
 * account's own rows explicitly first so the operation is deterministic even
 * if a deployment is still on an older schema. Admins cannot delete themselves
 * or another admin, which prevents accidentally removing the only operator.
 */
export async function deleteUserAction(
  _prev: DeleteUserResult,
  formData: FormData,
): Promise<DeleteUserResult> {
  const id = text(formData, "userId");
  const adminContext = await requireAdmin();

  if (!UUID_PATTERN.test(id)) {
    return { error: "ID pengguna tidak valid." };
  }
  if (id === adminContext.userId) {
    return { error: "Kamu tidak bisa menghapus akun yang sedang dipakai." };
  }

  const admin = createAdminServiceClient();
  if (!admin) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY belum diatur, jadi akun tidak dapat dihapus.",
    };
  }

  const { data: target, error: targetError } =
    await admin.auth.admin.getUserById(id);
  if (targetError || !target.user) {
    return { error: "Pengguna tidak ditemukan atau sudah dihapus." };
  }

  const { data: adminRow } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle();
  if (adminRow) {
    return {
      error:
        "Akun admin tidak dapat dihapus dari halaman ini. Cabut akses admin terlebih dahulu.",
    };
  }

  // Remove weddings owned by the account first. Child data (members, vendors,
  // guests, invitations, subscription, etc.) cascades from weddings.
  const { data: ownedWeddings, error: ownedError } = await admin
    .from("weddings")
    .select("id")
    .eq("created_by", id);

  if (ownedError) {
    console.error("[deleteUserAction] owned weddings:", ownedError);
    return { error: "Gagal membaca data wedding pengguna. Coba lagi." };
  }

  for (const wedding of ownedWeddings ?? []) {
    const { error } = await admin.from("weddings").delete().eq("id", wedding.id);
    if (error) {
      console.error("[deleteUserAction] delete wedding:", error);
      return {
        error: `Gagal menghapus wedding (${error.code ?? "?"}). Coba lagi.`,
      };
    }
  }

  // If the account was a partner, remove only the membership. The owner's
  // wedding is intentionally preserved.
  const { error: membershipError } = await admin
    .from("wedding_members")
    .delete()
    .eq("user_id", id);
  if (membershipError) {
    console.error("[deleteUserAction] delete membership:", membershipError);
    return { error: "Gagal menghapus keanggotaan wedding pengguna." };
  }

  // Payments and entitlements belong to the account. Deleting them explicitly
  // keeps the cleanup complete even if the auth FK is not present.
  const { error: paymentError } = await admin
    .from("payments")
    .delete()
    .eq("user_id", id);
  if (paymentError) {
    console.error("[deleteUserAction] delete payments:", paymentError);
    return { error: "Gagal menghapus data pembayaran pengguna." };
  }

  const { error: entitlementError } = await admin
    .from("user_entitlements")
    .delete()
    .eq("user_id", id);
  if (entitlementError) {
    console.error("[deleteUserAction] delete entitlement:", entitlementError);
    return { error: "Gagal menghapus akses pengguna." };
  }

  // This is the actual Supabase Auth deletion. It also cascades any remaining
  // account-linked rows.
  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    console.error("[deleteUserAction] delete auth user:", deleteError);
    return {
      error: `Gagal menghapus akun dari Supabase (${deleteError.status ?? "?"}): ${deleteError.message}`,
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/weddings");
  return {
    success: `Akun ${target.user.email ?? "pengguna"} beserta datanya sudah dihapus.`,
  };
}
