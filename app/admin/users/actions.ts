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

  const [targetResult, adminRowResult] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("admins").select("user_id").eq("user_id", id).maybeSingle(),
  ]);

  const { data: target, error: targetError } = targetResult;
  if (targetError || !target.user) {
    return { error: "Pengguna tidak ditemukan atau sudah dihapus." };
  }

  const { data: adminRow } = adminRowResult;
  if (adminRow) {
    return {
      error:
        "Akun admin tidak dapat dihapus dari halaman ini. Cabut akses admin terlebih dahulu.",
    };
  }

  const { data: ownedWeddings, error: ownedError } = await admin
    .from("weddings")
    .select("id")
    .eq("created_by", id);

  if (ownedError) {
    console.error("[deleteUserAction] owned weddings:", ownedError);
    return { error: "Gagal membaca data wedding pengguna. Coba lagi." };
  }

  const ownedWeddingIds = (ownedWeddings ?? []).map((wedding) => wedding.id);

  // Payments first: public.payments.wedding_id is ON DELETE RESTRICT, so an
  // account that ever paid would otherwise make the wedding delete fail with
  // 23503 and leave the whole operation half done. This also removes billing
  // history the account owns.
  const earlyDeletes = [
    admin.from("payments").delete().eq("user_id", id),
    admin.from("user_entitlements").delete().eq("user_id", id),
    admin.from("wedding_members").delete().eq("user_id", id),
  ];
  if (ownedWeddingIds.length > 0) {
    earlyDeletes.push(
      admin.from("payments").delete().in("wedding_id", ownedWeddingIds),
    );
  }

  const earlyResults = await Promise.all(earlyDeletes);
  const earlyLabels = ["payments", "entitlements", "membership", "wedding payments"];
  const earlyFailure = earlyResults.findIndex((result) => result.error);
  if (earlyFailure !== -1) {
    const failure = earlyResults[earlyFailure].error;
    console.error(
      `[deleteUserAction] delete ${earlyLabels[earlyFailure]}:`,
      failure,
    );
    return {
      error: `Gagal menghapus ${earlyLabels[earlyFailure]} pengguna (${failure?.code ?? "?"}). Coba lagi.`,
    };
  }

  // Weddings next; every child table (vendors, plans, guests, invitations,
  // donations, currency audit rows, ...) cascades from here.
  const weddingResults = await Promise.all(
    ownedWeddingIds.map((weddingId) =>
      admin.from("weddings").delete().eq("id", weddingId),
    ),
  );
  const weddingFailure = weddingResults.find((result) => result.error);
  if (weddingFailure?.error) {
    console.error("[deleteUserAction] delete wedding:", weddingFailure.error);
    return {
      error: `Gagal menghapus wedding (${weddingFailure.error.code ?? "?"}). Coba lagi.`,
    };
  }

  // This is the actual Supabase Auth deletion. It runs together with the
  // Storage cleanup so the admin does not wait for both in sequence.
  const [authResult] = await Promise.all([
    admin.auth.admin.deleteUser(id),
    removeStoragePrefix(admin, "payment-receipts", id),
    ...ownedWeddingIds.flatMap((weddingId) => [
      removeStoragePrefix(admin, "payment-proofs", weddingId),
      removeStoragePrefix(admin, "inspiration-images", weddingId),
      removeStoragePrefix(admin, "invitation-photos", weddingId),
      removeStoragePrefix(admin, "invitation-audio", weddingId),
    ]),
  ]);

  const deleteError = authResult.error;
  if (deleteError) {
    console.error("[deleteUserAction] delete auth user:", deleteError);
    return {
      error: `Gagal menghapus akun dari Supabase (${deleteError.status ?? "?"}): ${deleteError.message}`,
    };
  }

  // Best-effort Storage cleanup already ran concurrently above: Supabase does
  // not cascade Storage objects when an auth user or database row is deleted.
  // Files are namespaced as userId/... (receipts) and weddingId/... (planner
  // media), so the prefixes above cover every object the account owned.

  // Deliberately not revalidating /admin/users here: that page lists up to 1000
  // auth users on every render, so forcing it to re-render made the delete feel
  // slow. The row keeps its success message and the admin can refresh on demand.
  revalidatePath("/admin");
  revalidatePath("/admin/weddings");
  return {
    success: `Akun ${target.user.email ?? "pengguna"} beserta datanya sudah dihapus.`,
  };
}

type StorageAdmin = NonNullable<
  ReturnType<typeof createAdminServiceClient>
>;

/**
 * Remove every object under a folder prefix, including nested folders.
 * Storage cleanup is intentionally best-effort: a missing bucket or a storage
 * hiccup must not prevent the account/database deletion from completing.
 */
async function removeStoragePrefix(
  admin: StorageAdmin,
  bucket: string,
  prefix: string,
): Promise<void> {
  try {
    const queue = [prefix];
    const files: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const { data, error } = await admin.storage
        .from(bucket)
        .list(current, { limit: 1000 });

      if (error) {
        console.warn(
          `[deleteUserAction] storage list ${bucket}/${current}:`,
          error.message,
        );
        return;
      }

      for (const entry of data ?? []) {
        const path = `${current}/${entry.name}`;
        if (entry.id === null) {
          queue.push(path);
        } else {
          files.push(path);
        }
      }
    }

    for (let index = 0; index < files.length; index += 100) {
      const chunk = files.slice(index, index + 100);
      const { error } = await admin.storage.from(bucket).remove(chunk);
      if (error) {
        console.warn(
          `[deleteUserAction] storage remove ${bucket}:`,
          error.message,
        );
      }
    }
  } catch (error) {
    console.warn(
      `[deleteUserAction] storage cleanup ${bucket}/${prefix}:`,
      error instanceof Error ? error.message : error,
    );
  }
}
