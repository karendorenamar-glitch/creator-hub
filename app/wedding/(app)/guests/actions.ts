"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  enumValue,
  isEmail,
  isUuid,
  optionalText,
  parseCount,
  text,
} from "@/lib/wedding/validation";

const INVITATION_STATUSES = ["not_sent", "sent"] as const;
const RSVP_STATUSES = ["pending", "attending", "not_attending"] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type GuestValues = {
  name: string;
  phone: string | null;
  email: string | null;
  guest_group: string | null;
  invitation_status: "not_sent" | "sent";
  rsvp_status: "pending" | "attending" | "not_attending";
  plus_ones: number;
  notes: string | null;
};

function readGuest(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: GuestValues } | { ok: false; error: string } {
  const name = text(formData, "name").slice(0, 120);
  if (!name) return { ok: false, error: copy.form.required };

  const email = optionalText(formData, "email", 200);
  if (email && !isEmail(email)) {
    return { ok: false, error: copy.form.invalidEmail };
  }

  const plusOnesRaw = text(formData, "plusOnes");
  const plusOnes = plusOnesRaw ? parseCount(plusOnesRaw) : 0;
  if (plusOnes === null || plusOnes > 20) {
    return { ok: false, error: copy.form.invalidNumber };
  }

  return {
    ok: true,
    values: {
      name,
      phone: optionalText(formData, "phone", 40),
      email,
      guest_group: optionalText(formData, "guestGroup", 80),
      invitation_status: enumValue(
        formData,
        "invitationStatus",
        INVITATION_STATUSES,
        "not_sent",
      ),
      rsvp_status: enumValue(formData, "rsvpStatus", RSVP_STATUSES, "pending"),
      plus_ones: plusOnes,
      notes: optionalText(formData, "notes", 1000),
    },
  };
}

export async function createGuestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readGuest(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("guests").insert({
    wedding_id: ctx.session.wedding.id,
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/guests");
  return { success: ctx.copy.form.saved };
}

export async function updateGuestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readGuest(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase
    .from("guests")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/guests");
  return { success: ctx.copy.form.saved };
}

export async function deleteGuestAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("guests")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/guests");
  return null;
}
