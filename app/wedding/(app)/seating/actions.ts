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

type SeatRow = {
  id: string;
  event_id: string;
  capacity: number;
  kind?: string | null;
  side?: string | null;
  parent_table_id?: string | null;
  canvas_x: number;
  canvas_y: number;
  rotation?: number | null;
};

function chooseAdjacentSeats(
  target: SeatRow,
  seats: SeatRow[],
  occupied: Set<string>,
  needed: number,
): string[] | null {
  const candidates = seats.filter((seat) => {
    if (seat.event_id !== target.event_id) return false;
    if (seat.capacity !== 1) return false;
    if (target.parent_table_id) {
      return seat.parent_table_id === target.parent_table_id;
    }
    if (target.side === "left" || target.side === "right") {
      return seat.side === target.side;
    }
    return true;
  });

  const sorted = [...candidates].sort((a, b) => {
    if (target.parent_table_id) {
      const rotationA = Number(a.rotation ?? 0);
      const rotationB = Number(b.rotation ?? 0);
      if (rotationA !== rotationB) return rotationA - rotationB;
    }
    if (Number(a.canvas_y) !== Number(b.canvas_y)) {
      return Number(a.canvas_y) - Number(b.canvas_y);
    }
    return Number(a.canvas_x) - Number(b.canvas_x);
  });

  const targetIndex = sorted.findIndex((seat) => seat.id === target.id);
  if (targetIndex < 0 || occupied.has(target.id)) return null;
  if (needed <= 1) return [target.id];

  const maxStart = Math.min(targetIndex, sorted.length - needed);
  const minStart = Math.max(0, targetIndex - needed + 1);
  let best: { ids: string[]; distance: number } | null = null;
  for (let start = minStart; start <= maxStart; start += 1) {
    const window = sorted.slice(start, start + needed);
    if (window.some((seat) => occupied.has(seat.id))) continue;
    const distance = Math.abs(start - targetIndex);
    if (!best || distance < best.distance) {
      best = { ids: window.map((seat) => seat.id), distance };
    }
  }
  return best?.ids ?? null;
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

  let table: SeatRow | null = null;
  const fullTable = await ctx.supabase
    .from("seating_tables")
    .select("id, event_id, capacity, kind, side, parent_table_id, canvas_x, canvas_y, rotation")
    .eq("id", tableId)
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  table = fullTable.data as SeatRow | null;
  let tableError = fullTable.error;
  if (tableError?.code === "42703") {
    const fallback = await ctx.supabase
      .from("seating_tables")
      .select("id, event_id, capacity, canvas_x, canvas_y")
      .eq("id", tableId)
      .eq("event_id", eventId)
      .eq("wedding_id", ctx.weddingId)
      .maybeSingle();
    table = fallback.data as SeatRow | null;
    tableError = fallback.error;
  }
  const { data: guest } = await ctx.supabase
    .from("guests")
    .select("id, plus_ones")
    .eq("id", guestId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();

  if (tableError || !table || !guest) return { error: ctx.copy.errors.notFound };
  if (Number(table.capacity) !== 1) {
    return { error: ctx.copy.seating.seatTaken };
  }

  const needed = guestPeopleCount(guest);
  type AssignmentRow = {
    id: string;
    table_id: string;
    guest_id: string;
    seat_ids?: string[];
  };
  const fullRows = await ctx.supabase
    .from("seating_assignments")
    .select("id, table_id, guest_id, seat_ids")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  let currentRowsSafe: AssignmentRow[] = (fullRows.data ?? []) as AssignmentRow[];
  if (fullRows.error?.code === "42703") {
    const fallback = await ctx.supabase
      .from("seating_assignments")
      .select("id, table_id, guest_id")
      .eq("event_id", eventId)
      .eq("wedding_id", ctx.weddingId);
    if (!fallback.error) currentRowsSafe = fallback.data ?? [];
  }

  const current = currentRowsSafe.find((row) => row.guest_id === guestId);
  const alreadyCovers =
    current?.table_id === tableId &&
    (current.seat_ids?.length ?? 0) >= needed;
  if (alreadyCovers) return { success: ctx.copy.seating.assigned };

  const occupied = new Set<string>();
  for (const row of currentRowsSafe) {
    if (row.guest_id === guestId) continue;
    occupied.add(row.table_id);
    for (const seatId of row.seat_ids ?? []) occupied.add(seatId);
  }

  let seats: SeatRow[] | null = null;
  const fullSeats = await ctx.supabase
    .from("seating_tables")
    .select("id, event_id, capacity, kind, side, parent_table_id, canvas_x, canvas_y, rotation")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  seats = (fullSeats.data ?? []) as SeatRow[];
  let seatsError = fullSeats.error;
  if (seatsError?.code === "42703") {
    const fallback = await ctx.supabase
      .from("seating_tables")
      .select("id, event_id, capacity, canvas_x, canvas_y")
      .eq("event_id", eventId)
      .eq("wedding_id", ctx.weddingId);
    seats = (fallback.data ?? []) as SeatRow[];
    seatsError = fallback.error;
  }
  if (seatsError || !seats) return { error: actionError(seatsError ?? { message: "" }, ctx.copy) };

  const chosen = chooseAdjacentSeats(
    table as SeatRow,
    seats as SeatRow[],
    occupied,
    needed,
  );
  if (!chosen) return { error: ctx.copy.seating.notEnoughSeats };

  let { error } = await ctx.supabase.from("seating_assignments").upsert(
    {
      wedding_id: ctx.weddingId,
      event_id: eventId,
      table_id: tableId,
      guest_id: guestId,
      seat_ids: chosen,
    },
    { onConflict: "event_id,guest_id" },
  );
  if (error?.code === "42703") {
    // Compatibility during a phased deploy: the assignment works, but extra
    // seats cannot be reserved until migration 035 is applied.
    const fallback = await ctx.supabase.from("seating_assignments").upsert(
      {
        wedding_id: ctx.weddingId,
        event_id: eventId,
        table_id: tableId,
        guest_id: guestId,
      },
      { onConflict: "event_id,guest_id" },
    );
    error = fallback.error;
  }

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.seating.assigned };
}

export async function swapSeatGuestsAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "eventId");
  const guestA = text(formData, "guestA");
  const guestB = text(formData, "guestB");
  if (![eventId, guestA, guestB].every(isUuid) || guestA === guestB) {
    return { error: ctx.copy.errors.notFound };
  }

  type SwapAssignment = {
    id: string;
    guest_id: string;
    table_id: string;
    seat_ids?: string[];
  };
  const full = await ctx.supabase
    .from("seating_assignments")
    .select("id, guest_id, table_id, seat_ids")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .in("guest_id", [guestA, guestB]);
  let rows: SwapAssignment[] = (full.data ?? []) as SwapAssignment[];
  if (full.error?.code === "42703") {
    const fallback = await ctx.supabase
      .from("seating_assignments")
      .select("id, guest_id, table_id")
      .eq("event_id", eventId)
      .eq("wedding_id", ctx.weddingId)
      .in("guest_id", [guestA, guestB]);
    if (fallback.error) return { error: actionError(fallback.error, ctx.copy) };
    rows = fallback.data ?? [];
  } else if (full.error) {
    return { error: actionError(full.error, ctx.copy) };
  }

  const a = rows.find((row) => row.guest_id === guestA);
  const b = rows.find((row) => row.guest_id === guestB);
  if (!a || !b) return { error: ctx.copy.seating.swapNeedsBoth };

  const seatsA = a.seat_ids?.length ? a.seat_ids : [a.table_id];
  const seatsB = b.seat_ids?.length ? b.seat_ids : [b.table_id];
  if (seatsA.length !== seatsB.length) {
    return { error: ctx.copy.seating.swapSizeMismatch };
  }

  const first = await ctx.supabase
    .from("seating_assignments")
    .update({ table_id: b.table_id, seat_ids: seatsB })
    .eq("id", a.id)
    .eq("wedding_id", ctx.weddingId);
  if (first.error) return { error: actionError(first.error, ctx.copy) };

  const second = await ctx.supabase
    .from("seating_assignments")
    .update({ table_id: a.table_id, seat_ids: seatsA })
    .eq("id", b.id)
    .eq("wedding_id", ctx.weddingId);
  if (second.error) {
    // Best-effort rollback of the first swap row.
    await ctx.supabase
      .from("seating_assignments")
      .update({ table_id: a.table_id, seat_ids: seatsA })
      .eq("id", a.id)
      .eq("wedding_id", ctx.weddingId);
    return { error: actionError(second.error, ctx.copy) };
  }

  revalidateSeating();
  return { success: ctx.copy.seating.swapped };
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
