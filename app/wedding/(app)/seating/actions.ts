"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionError,
  getWeddingMutationContext,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { guestPeopleCount, totalGuestPeople } from "@/lib/wedding/guest-count";
import {
  enumValue,
  isUuid,
  optionalText,
  parseCount,
  text,
} from "@/lib/wedding/validation";

const SHAPES = ["round", "rect"] as const;

async function context() {
  const ctx = await getWeddingMutationContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

async function tablePeople(
  supabase: Awaited<ReturnType<typeof context>>["supabase"],
  tableId: string,
) {
  const { data: assignments } = await supabase
    .from("seating_assignments")
    .select("guest_id")
    .eq("table_id", tableId);
  const guestIds = (assignments ?? []).map((row) => row.guest_id);
  if (guestIds.length === 0) return 0;
  const { data: guests } = await supabase
    .from("guests")
    .select("id, plus_ones")
    .in("id", guestIds);
  return totalGuestPeople(guests ?? []);
}

function revalidateSeating() {
  revalidatePath("/wedding/seating");
}

export async function saveTableAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const copy: ModuleCopy = ctx.copy;
  const eventId = text(formData, "eventId");
  const id = text(formData, "id");
  if (!isUuid(eventId) || (id && !isUuid(id))) {
    return { error: copy.errors.notFound };
  }

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("id")
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event) return { error: copy.errors.notFound };

  const name = text(formData, "name").slice(0, 80);
  if (!name) return { error: copy.form.required };

  const kind = enumValue(formData, "kind", ["table", "chair"] as const, "table");
  const capacity = kind === "chair" ? 1 : parseCount(text(formData, "capacity"));
  if (capacity === null || capacity > 100) {
    return { error: copy.form.invalidNumber };
  }

  const shape = enumValue(formData, "shape", SHAPES, "round");
  const rotation = Math.min(
    360,
    Math.max(0, Number(text(formData, "rotation")) || 0),
  );
  const width = Math.min(35, Math.max(4, Number(text(formData, "width")) || 12));
  const height = Math.min(35, Math.max(4, Number(text(formData, "height")) || 12));
  const canvasX = Math.min(100, Math.max(0, Number(text(formData, "x")) || 50));
  const canvasY = Math.min(100, Math.max(0, Number(text(formData, "y")) || 50));

  if (id) {
    const { data: existing } = await ctx.supabase
      .from("seating_tables")
      .select("id, capacity")
      .eq("id", id)
      .eq("wedding_id", ctx.weddingId)
      .maybeSingle();
    if (!existing) return { error: copy.errors.notFound };
    const occupied = await tablePeople(ctx.supabase, id);
    if (kind === "chair") {
      // A household may occupy one chair record with plus-ones; editing the
      // chair should not be blocked by its guest count.
    } else if (capacity < occupied) {
      return { error: copy.seating.capacityTooLow };
    }
  }

  const values = {
    wedding_id: ctx.weddingId,
    event_id: eventId,
    name,
    shape,
    capacity,
    canvas_x: canvasX,
    canvas_y: canvasY,
    width,
    height,
    kind,
    rotation,
  };

  let { error } = id
    ? await ctx.supabase
        .from("seating_tables")
        .update(values)
        .eq("id", id)
        .eq("wedding_id", ctx.weddingId)
    : await ctx.supabase.from("seating_tables").insert(values);

  if (error?.code === "42703") {
    const { kind: _kind, rotation: _rotation, ...legacyValues } = values;
    void _kind;
    void _rotation;
    const retry = id
      ? await ctx.supabase
          .from("seating_tables")
          .update(legacyValues)
          .eq("id", id)
          .eq("wedding_id", ctx.weddingId)
      : await ctx.supabase.from("seating_tables").insert(legacyValues);
    error = retry.error;
  }

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: copy.form.saved };
}

export async function generateAkadChairsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const copy: ModuleCopy = ctx.copy;
  const eventId = text(formData, "eventId");
  if (!isUuid(eventId)) return { error: copy.errors.notFound };

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("id, event_type")
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event || event.event_type !== "akad") {
    return { error: copy.errors.notFound };
  }

  const left = parseCount(text(formData, "left"));
  const right = parseCount(text(formData, "right"));
  const rows = parseCount(text(formData, "rows"));
  if (
    left === null ||
    right === null ||
    rows === null ||
    left > 100 ||
    right > 100 ||
    rows < 1 ||
    rows > 20 ||
    left + right === 0
  ) {
    return { error: copy.form.invalidNumber };
  }

  const { count: assigned, error: assignedError } = await ctx.supabase
    .from("seating_assignments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  if (assignedError) return { error: actionError(assignedError, copy) };
  if ((assigned ?? 0) > 0) return { error: copy.seating.layoutHasGuests };

  const { error: deleteError } = await ctx.supabase
    .from("seating_tables")
    .delete()
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .eq("capacity", 1);
  if (deleteError) return { error: actionError(deleteError, copy) };

  const seats = [] as Array<{
    wedding_id: string;
    event_id: string;
    name: string;
    shape: "rect";
    capacity: number;
    canvas_x: number;
    canvas_y: number;
    width: number;
    height: number;
    sort_order: number;
    kind: "chair";
    side: "left" | "right";
    rotation: number;
    parent_table_id: null;
  }>;
  let order = 0;
  for (const side of ["left", "right"] as const) {
    const count = side === "left" ? left : right;
    const perRow = Math.ceil(count / rows);
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / perRow);
      const column = index % perRow;
      const spread = perRow > 1 ? 36 / (perRow - 1) : 0;
      const x =
        side === "left" ? 8 + column * spread : 92 - column * spread;
      const y = rows > 1 ? 20 + (row * 65) / (rows - 1) : 52;
      seats.push({
        wedding_id: ctx.weddingId,
        event_id: eventId,
        name: `${side === "left" ? "L" : "R"}${index + 1}`,
        shape: "rect",
        capacity: 1,
        canvas_x: x,
        canvas_y: y,
        width: 4.5,
        height: 6,
        sort_order: order++,
        kind: "chair",
        side,
        rotation: 0,
        parent_table_id: null,
      });
    }
  }

  let { error: insertError } = await ctx.supabase
    .from("seating_tables")
    .insert(seats);
  if (insertError?.code === "42703") {
    const fallback = await ctx.supabase.from("seating_tables").insert(
      seats.map((seat) => {
        const { kind, side, rotation, parent_table_id, ...base } = seat;
        void kind;
        void side;
        void rotation;
        void parent_table_id;
        return base;
      }),
    );
    insertError = fallback.error;
  }
  if (insertError) return { error: actionError(insertError, copy) };

  revalidateSeating();
  return { success: copy.form.saved };
}

export async function moveTableAction(formData: FormData): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  const canvasX = Math.min(100, Math.max(0, Number(text(formData, "x")) || 0));
  const canvasY = Math.min(100, Math.max(0, Number(text(formData, "y")) || 0));

  const { error } = await ctx.supabase
    .from("seating_tables")
    .update({ canvas_x: canvasX, canvas_y: canvasY })
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  return { success: ctx.copy.form.saved };
}

export async function moveStageAction(formData: FormData): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "id");
  if (!isUuid(eventId)) return { error: ctx.copy.errors.notFound };
  const x = Math.min(100, Math.max(0, Number(text(formData, "x")) || 50));
  const y = Math.min(100, Math.max(0, Number(text(formData, "y")) || 7));

  const { error } = await ctx.supabase
    .from("seating_events")
    .update({ stage_x: x, stage_y: y })
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId);
  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.form.saved };
}

export async function deleteTableAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("seating_tables")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return null;
}

export async function saveEventAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };
  const name = text(formData, "name").slice(0, 80);
  if (!name) return { error: ctx.copy.form.required };

  const eventDate = optionalText(formData, "eventDate", 10);
  const startTime = optionalText(formData, "startTime", 20);
  const { error } = await ctx.supabase
    .from("seating_events")
    .update({
      name,
      event_date: eventDate || null,
      start_time: startTime || null,
    })
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.seating.eventSaved };
}


export async function assignGuestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "eventId");
  const tableId = text(formData, "tableId");
  const guestId = text(formData, "guestId");
  if (!isUuid(eventId) || !isUuid(tableId) || !isUuid(guestId)) {
    return { error: ctx.copy.errors.notFound };
  }

  const { data: table } = await ctx.supabase
    .from("seating_tables")
    .select("id, event_id, capacity")
    .eq("id", tableId)
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  const { data: guest } = await ctx.supabase
    .from("guests")
    .select("id, plus_ones")
    .eq("id", guestId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();

  if (!table || !guest) return { error: ctx.copy.errors.notFound };

  const { data: current } = await ctx.supabase
    .from("seating_assignments")
    .select("table_id")
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .maybeSingle();
  if (current?.table_id === tableId) {
    return { success: ctx.copy.seating.assigned };
  }

  const occupied = await tablePeople(ctx.supabase, tableId);
  const needed = occupied + guestPeopleCount(guest);
  const allowOverCapacity = text(formData, "allowOverCapacity") === "1";
  if (needed > table.capacity && !allowOverCapacity) {
    return { error: ctx.copy.seating.overCapacity };
  }

  const { error } = await ctx.supabase.from("seating_assignments").upsert(
    {
      wedding_id: ctx.weddingId,
      event_id: eventId,
      table_id: tableId,
      guest_id: guestId,
    },
    { onConflict: "event_id,guest_id" },
  );

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.seating.assigned };
}

export async function unassignGuestAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "eventId");
  const guestId = text(formData, "guestId");
  if (!isUuid(eventId) || !isUuid(guestId)) {
    return { error: ctx.copy.errors.notFound };
  }

  const { error } = await ctx.supabase
    .from("seating_assignments")
    .delete()
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.seating.removed };
}
