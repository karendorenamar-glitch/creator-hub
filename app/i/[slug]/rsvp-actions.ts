"use server";

import { createWeddingClient } from "@/lib/wedding/supabase";
import { optionalText, text } from "@/lib/wedding/validation";

export type RsvpState = { error?: string; success?: boolean } | null;

export async function submitRsvpAction(
  _prev: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const slug = text(formData, "slug");
  const name = text(formData, "name").slice(0, 120);
  const attendance =
    text(formData, "attendance") === "not_attending"
      ? "not_attending"
      : "attending";
  const rawGuests = Number(text(formData, "guests"));
  const guests =
    attendance === "attending"
      ? Math.min(10, Math.max(1, Number.isFinite(rawGuests) ? rawGuests : 1))
      : 1;

  if (!name) {
    return { error: "Mohon isi nama Anda." };
  }

  const supabase = await createWeddingClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, wedding_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!invitation) {
    return { error: "Undangan tidak tersedia." };
  }

  const { error } = await supabase.from("invitation_rsvps").insert({
    invitation_id: invitation.id,
    wedding_id: invitation.wedding_id,
    name,
    attendance,
    guests,
    message: optionalText(formData, "message", 1000),
  });

  if (error) {
    return { error: "Gagal mengirim konfirmasi. Coba lagi." };
  }

  return { success: true };
}
