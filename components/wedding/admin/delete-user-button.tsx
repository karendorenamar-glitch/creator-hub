"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteUserAction,
  type DeleteUserResult,
} from "@/app/admin/users/actions";

/**
 * Two-step hard delete for the admin user directory. The server action
 * re-checks admin rights and deletes the auth user + linked rows.
 */
export function DeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<
    DeleteUserResult,
    FormData
  >(deleteUserAction, null);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <p role="status" className="max-w-48 text-xs text-emerald-700">
        {state.success}
      </p>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-rose-700 transition-colors hover:bg-rose-50"
        title={`Hapus akun ${email ?? userId}`}
      >
        <Trash2 className="size-3.5" aria-hidden />
        Hapus akun
      </button>
    );
  }

  return (
    <form action={formAction} className="flex max-w-56 flex-wrap items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      {state?.error ? (
        <p role="alert" className="w-full text-xs text-rose-700">
          {state.error}
        </p>
      ) : null}
      <p className="w-full text-xs leading-snug text-rose-700">
        Hapus permanen {email ?? "akun ini"} beserta wedding, pembayaran, dan
        aksesnya?
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        {pending ? "Menghapus…" : "Ya, hapus"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-lg px-2 py-1.5 text-xs text-cocoa/60 hover:bg-blush/40 disabled:opacity-60"
      >
        Batal
      </button>
    </form>
  );
}
