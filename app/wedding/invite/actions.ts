"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/get-locale";
import type { ActionResult } from "@/lib/wedding/action-context";
import { weddingCopy } from "@/lib/wedding/copy";
import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { text } from "@/lib/wedding/validation";

export async function acceptWeddingInviteLinkAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _prev;
  const token = text(formData, "token");
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      token
        ? `/wedding/login?next=${encodeURIComponent(`/wedding/invite/${token}`)}`
        : "/wedding/login",
    );
  }

  const locale = await getLocale();
  const ui = weddingCopy[locale].settings;
  if (!token) return { error: ui.inviteAcceptInvalid };

  const supabase = await createWeddingClient();
  const { data: weddingId, error } = await supabase.rpc(
    "accept_wedding_invite_link",
    { p_token: token },
  );

  if (error || !weddingId) {
    const message = error?.message.toLowerCase() ?? "";
    return {
      error: message.includes("own this wedding")
        ? ui.inviteAcceptOwner
        : message.includes("partner") || message.includes("at most 2 members")
          ? ui.inviteLimit
          : ui.inviteAcceptInvalid,
    };
  }

  revalidatePath("/wedding", "layout");
  redirect("/wedding/dashboard");
}
