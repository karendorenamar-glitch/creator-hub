"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionError,
  getWeddingMutationContext,
  type ActionResult,
} from "@/lib/wedding/action-context";
import { guestPeopleCount, totalGuestPeople } from "@/lib/wedding/guest-count";
import {
  enumValue,
  isDateString,
  isUuid,
  optionalText,
  parseCount,
  text,
} from "@/lib/wedding/validation";

const ROOM_TYPES = ["single", "twin", "double", "suite", "custom"] as const;
const BREAKFAST_TYPES = ["none", "included", "custom", "unconfigured"] as const;

async function context() {
  const ctx = await getWeddingMutationContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

async function roomPeople(
  supabase: Awaited<ReturnType<typeof context>>["supabase"],
  roomId: string,
) {
  const { data: assignments } = await supabase
    .from("room_assignments")
    .select("guest_id")
    .eq("room_id", roomId);
  const ids = (assignments ?? []).map((row) => row.guest_id);
  if (ids.length === 0) return 0;
  const { data: guests } = await supabase
    .from("guests")
    .select("id, plus_ones")
    .in("id", ids);
  return totalGuestPeople(guests ?? []);
}

function revalidateRooms() {
  revalidatePath("/wedding/rooms");
}

export async function saveRoomAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (id && !isUuid(id)) return { error: ctx.copy.errors.notFound };

  const name = text(formData, "name").slice(0, 80);
  if (!name) return { error: ctx.copy.form.required };
  const capacity = parseCount(text(formData, "capacity"));
  if (capacity === null || capacity > 20) {
    return { error: ctx.copy.form.invalidNumber };
  }

  const checkIn = optionalText(formData, "checkIn", 10);
  const checkOut = optionalText(formData, "checkOut", 10);
  if (
    (checkIn && !isDateString(checkIn)) ||
    (checkOut && !isDateString(checkOut)) ||
    (checkIn && checkOut && checkOut < checkIn)
  ) {
    return { error: ctx.copy.form.invalidDate };
  }

  const breakfastType = enumValue(
    formData,
    "breakfastType",
    BREAKFAST_TYPES,
    "unconfigured",
  );
  const rawPax = text(formData, "breakfastPax");
  const breakfastPax =
    breakfastType === "none" || breakfastType === "unconfigured"
      ? null
      : rawPax
        ? parseCount(rawPax)
        : null;
  if (breakfastPax !== null && breakfastPax > 20) {
    return { error: ctx.copy.form.invalidNumber };
  }
  if (breakfastType === "included" && breakfastPax === null) {
    return { error: ctx.copy.form.invalidNumber };
  }

  const override = text(formData, "breakfastOverride") === "1";
  if (breakfastPax !== null && breakfastPax > capacity && !override) {
    return { error: ctx.copy.rooms.breakfastOverCapacity };
  }

  if (id) {
    const { data: existing } = await ctx.supabase
      .from("rooms")
      .select("id")
      .eq("id", id)
      .eq("wedding_id", ctx.weddingId)
      .maybeSingle();
    if (!existing) return { error: ctx.copy.errors.notFound };
    const occupied = await roomPeople(ctx.supabase, id);
    if (capacity < occupied) {
      return { error: ctx.copy.rooms.capacityConflict };
    }
  }

  const values = {
    wedding_id: ctx.weddingId,
    name,
    hotel_name: optionalText(formData, "hotelName", 120),
    room_type: enumValue(formData, "roomType", ROOM_TYPES, "double"),
    capacity,
    breakfast_type: breakfastType,
    breakfast_pax: breakfastPax,
    breakfast_notes: optionalText(formData, "breakfastNotes", 500),
    check_in: checkIn || null,
    check_out: checkOut || null,
    notes: optionalText(formData, "notes", 1000),
  };

  const { error } = id
    ? await ctx.supabase
        .from("rooms")
        .update(values)
        .eq("id", id)
        .eq("wedding_id", ctx.weddingId)
    : await ctx.supabase.from("rooms").insert(values);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateRooms();
  return { success: ctx.copy.form.saved };
}


export async function deleteRoomAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("rooms")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateRooms();
  return null;
}

export async function assignRoomGuestAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const roomId = text(formData, "roomId");
  const guestId = text(formData, "guestId");
  if (!isUuid(roomId) || !isUuid(guestId)) {
    return { error: ctx.copy.errors.notFound };
  }

  const { data: room } = await ctx.supabase
    .from("rooms")
    .select("id, capacity")
    .eq("id", roomId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  const { data: guest } = await ctx.supabase
    .from("guests")
    .select("id, plus_ones")
    .eq("id", guestId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!room || !guest) return { error: ctx.copy.errors.notFound };

  const { data: current } = await ctx.supabase
    .from("room_assignments")
    .select("room_id")
    .eq("wedding_id", ctx.weddingId)
    .eq("guest_id", guestId)
    .maybeSingle();
  if (current?.room_id === roomId) {
    return { success: ctx.copy.form.saved };
  }

  const occupied = await roomPeople(ctx.supabase, roomId);
  if (occupied + guestPeopleCount(guest) > room.capacity) {
    return { error: ctx.copy.rooms.capacityExceeded };
  }

  const { error } = await ctx.supabase.from("room_assignments").upsert(
    {
      wedding_id: ctx.weddingId,
      room_id: roomId,
      guest_id: guestId,
    },
    { onConflict: "wedding_id,guest_id" },
  );
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateRooms();
  return { success: ctx.copy.form.saved };
}

export async function removeRoomGuestAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const roomId = text(formData, "roomId");
  const guestId = text(formData, "guestId");
  if (!isUuid(roomId) || !isUuid(guestId)) {
    return { error: ctx.copy.errors.notFound };
  }

  const { error } = await ctx.supabase
    .from("room_assignments")
    .delete()
    .eq("room_id", roomId)
    .eq("guest_id", guestId)
    .eq("wedding_id", ctx.weddingId);
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateRooms();
  return { success: ctx.copy.rooms.removeGuest };
}
