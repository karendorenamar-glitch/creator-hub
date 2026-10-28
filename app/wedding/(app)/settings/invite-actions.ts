"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { isUuid, text } from "@/lib/wedding/validation";
import { weddingCopy } from "@/lib/wedding/copy";

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

export async function createWeddingInviteAction(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  void _prev;
  void _formData;
  const ctx = await context();
  const ui = weddingCopy[ctx.locale].settings;
  if (ctx.session.role !== "owner") {
    return { error: ui.inviteOwnerOnly };
  }

  const { data: members, error: memberError } = await ctx.supabase
    .from("wedding_members")
    .select("user_id, role")
    .eq("wedding_id", ctx.session.wedding.id);

  if (memberError) return { error: actionError(memberError, ctx.copy) };
  if ((members ?? []).some((member) => member.role === "partner")) {
    return { error: ui.inviteLimit };
  }

  const { data: pendingRows, error: pendingError } = await ctx.supabase
    .from("wedding_invites")
    .select("id")
    .eq("wedding_id", ctx.session.wedding.id)
    .is("accepted_at", null)
    .limit(1);

  if (pendingError) return { error: actionError(pendingError, ctx.copy) };
  if (pendingRows?.length) {
    return { error: ui.inviteExisting };
  }

  const { error } = await ctx.supabase.from("wedding_invites").insert({
    wedding_id: ctx.session.wedding.id,
    email: null,
    invited_by: ctx.session.userId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: ui.inviteExisting };
    }
    return { error: actionError(error, ctx.copy) };
  }

  revalidateWedding("/wedding/dashboard");
  return { success: ui.inviteCreated };
}

export async function revokeWeddingInviteAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const ui = weddingCopy[ctx.locale].settings;
  if (ctx.session.role !== "owner") {
    return { error: ui.inviteOwnerOnly };
  }

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("wedding_invites")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .is("accepted_at", null);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/dashboard");
  return { success: ui.inviteRevoked };
}
