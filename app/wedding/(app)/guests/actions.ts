"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { getLocale } from "@/lib/i18n/get-locale";
import { expandGuestPeople } from "@/lib/wedding/guest-count";
import { moduleCopy, type ModuleCopy } from "@/lib/wedding/module-copy";
import { getCurrentUser } from "@/lib/wedding/session";
import { createWeddingClient } from "@/lib/wedding/supabase";
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
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) redirect("/wedding/login");

  const supabase = await createWeddingClient();
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/wedding/login");

  return {
    supabase,
    weddingId: membership.wedding_id,
    copy: moduleCopy[locale],
  };
}

type GuestCommon = {
  side: "bride" | "groom";
  email: string | null;
  guest_group: string | null;
  invitation_status: "not_sent" | "sent";
  rsvp_status: "pending" | "attending" | "not_attending";
  notes: string | null;
};

type GuestPerson = {
  name: string;
  phone: string | null;
  plus_ones: number;
};

type GuestValues = GuestCommon & GuestPerson;

function readGuestCommon(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: GuestCommon } | { ok: false; error: string } {
  const side = text(formData, "side");
  if (side !== "bride" && side !== "groom") {
    return { ok: false, error: copy.guests.sideRequired };
  }

  const email = optionalText(formData, "email", 200);
  if (email && !isEmail(email)) {
    return { ok: false, error: copy.form.invalidEmail };
  }

  return {
    ok: true,
    values: {
      side,
      email,
      guest_group: optionalText(formData, "guestGroup", 80),
      invitation_status: enumValue(
        formData,
        "invitationStatus",
        INVITATION_STATUSES,
        "not_sent",
      ),
      rsvp_status: enumValue(formData, "rsvpStatus", RSVP_STATUSES, "pending"),
      notes: optionalText(formData, "notes", 1000),
    },
  };
}

function readGuestPeople(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: GuestPerson[] } | { ok: false; error: string } {
  // The form renders name/phone/plusOnes together for every row, so the three
  // arrays stay aligned even when an empty row is submitted. `plusOnes` in the
  // form is the TOTAL number of people in that invitation row, not the number
  // of additional companions. The database still stores `plus_ones` as the
  // number of companions (total - 1).
  const names = formData.getAll("name").map((value) => String(value).trim());
  const phones = formData.getAll("phone").map((value) => String(value).trim());
  const plusOnes = formData
    .getAll("plusOnes")
    .map((value) => String(value).trim());
  const rowCount = Math.max(names.length, phones.length, plusOnes.length);
  const people: GuestPerson[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const name = names[index] ?? "";
    const phone = phones[index] ?? "";
    const plusOnesRaw = plusOnes[index] ?? "";
    const normalizedPlusOnes = plusOnesRaw.replace(/[^\d]/g, "");

    // Ignore a completely empty row. A blank/default total of 1 does not make
    // an otherwise blank row count as a person.
    if (!name && !phone && (!normalizedPlusOnes || normalizedPlusOnes === "1")) {
      continue;
    }
    if (!name) return { ok: false, error: copy.form.required };

    const totalPeople = plusOnesRaw ? parseCount(plusOnesRaw) : 1;
    if (totalPeople === null || totalPeople < 1 || totalPeople > 21) {
      return { ok: false, error: copy.form.invalidNumber };
    }

    people.push({
      name: name.slice(0, 120),
      phone: phone ? phone.slice(0, 40) : null,
      // Stored as companions; 2 pax becomes 2 guest rows after expansion.
      plus_ones: totalPeople - 1,
    });
  }

  if (people.length === 0) {
    return { ok: false, error: copy.form.required };
  }

  return { ok: true, values: people };
}

function readGuest(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: GuestValues } | { ok: false; error: string } {
  const common = readGuestCommon(formData, copy);
  if (!common.ok) return common;

  const people = readGuestPeople(formData, copy);
  if (!people.ok) return people;

  return {
    ok: true,
    values: { ...common.values, ...people.values[0] },
  };
}

export async function createGuestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const common = readGuestCommon(formData, ctx.copy);
  if (!common.ok) return { error: common.error };

  const people = readGuestPeople(formData, ctx.copy);
  if (!people.ok) return { error: people.error };

  const { error } = await ctx.supabase.from("guests").insert(
    people.values.flatMap((person) =>
      expandGuestPeople(person).map((expanded) => ({
        wedding_id: ctx.weddingId,
        ...common.values,
        ...expanded,
      })),
    ),
  );

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/guests", "/wedding/seating");
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

  const expanded = expandGuestPeople(parsed.values);
  const companions = expanded.slice(1);
  let companionIds: string[] = [];

  if (companions.length > 0) {
    const { data: inserted, error: insertError } = await ctx.supabase
      .from("guests")
      .insert(
        companions.map((person) => ({
          wedding_id: ctx.weddingId,
          ...person,
        })),
      )
      .select("id");

    if (insertError) return { error: actionError(insertError, ctx.copy) };
    companionIds = (inserted ?? []).map((row) => String(row.id));
  }

  const { error } = await ctx.supabase
    .from("guests")
    .update({ ...parsed.values, plus_ones: 0 })
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);

  if (error) {
    if (companionIds.length > 0) {
      await ctx.supabase
        .from("guests")
        .delete()
        .in("id", companionIds)
        .eq("wedding_id", ctx.weddingId);
    }
    return { error: actionError(error, ctx.copy) };
  }

  revalidateWedding("/wedding/guests", "/wedding/seating");
  return { success: ctx.copy.form.saved };
}

export async function splitPlusOnesAction(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  void _prev;
  void _formData;
  const ctx = await context();
  const { data: legacy, error: legacyError } = await ctx.supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", ctx.weddingId)
    .gt("plus_ones", 0);

  if (legacyError) return { error: actionError(legacyError, ctx.copy) };

  let split = 0;

  for (const guest of legacy ?? []) {
    const companions = expandGuestPeople(guest).slice(1);
    if (companions.length === 0) continue;

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("guests")
      .insert(
        companions.map((person) => ({
          wedding_id: ctx.weddingId,
          name: person.name,
          phone: person.phone,
          email: person.email,
          guest_group: person.guest_group,
          invitation_status: person.invitation_status,
          rsvp_status: person.rsvp_status,
          plus_ones: 0,
          notes: person.notes,
          side: person.side,
        })),
      )
      .select("id");

    if (insertError) return { error: actionError(insertError, ctx.copy) };
    const companionIds = (inserted ?? []).map((row) => String(row.id));

    const { error: updateError } = await ctx.supabase
      .from("guests")
      .update({ plus_ones: 0 })
      .eq("id", guest.id)
      .eq("wedding_id", ctx.weddingId);

    if (updateError) {
      if (companionIds.length > 0) {
        await ctx.supabase
          .from("guests")
          .delete()
          .in("id", companionIds)
          .eq("wedding_id", ctx.weddingId);
      }
      return { error: actionError(updateError, ctx.copy) };
    }

    // Keep the original guest in its first chair and release any extra chairs
    // so the newly split companions can be placed one by one.
    const { data: assignments } = await ctx.supabase
      .from("seating_assignments")
      .select("id, seat_ids")
      .eq("guest_id", guest.id)
      .eq("wedding_id", ctx.weddingId);
    for (const assignment of assignments ?? []) {
      const seatIds = assignment.seat_ids ?? [];
      if (seatIds.length > 1) {
        await ctx.supabase
          .from("seating_assignments")
          .update({ seat_ids: [seatIds[0]] })
          .eq("id", assignment.id)
          .eq("wedding_id", ctx.weddingId);
      }
    }

    split += 1;
  }

  revalidateWedding("/wedding/guests", "/wedding/seating");
  return {
    success:
      split === 0
        ? ctx.copy.guests.splitPlusOnesNone
        : ctx.copy.guests.splitPlusOnesDone.replace("{count}", String(split)),
  };
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
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/guests", "/wedding/seating");
  return null;
}
