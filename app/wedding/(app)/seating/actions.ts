"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionError,
  getWeddingMutationContext,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import { guestPeopleCount } from "@/lib/wedding/guest-count";
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
  const { data: table } = await supabase
    .from("seating_tables")
    .select("id, event_id, parent_table_id")
    .eq("id", tableId)
    .maybeSingle();
  if (!table) return 0;

  const { data: event } = await supabase
    .from("seating_events")
    .select("id, event_type")
    .eq("id", table.event_id)
    .maybeSingle();
  if (!event) return 0;

  const targetId = table.parent_table_id ?? table.id;
  const { data: rows } = await supabase
    .from("seating_assignments")
    .select("guest_id, table_id, seat_ids")
    .eq("event_id", event.id);
  const guestIds = Array.from(new Set((rows ?? []).map((row) => row.guest_id)));
  if (guestIds.length === 0) return 0;
  const { data: guests } = await supabase
    .from("guests")
    .select("id, plus_ones")
    .in("id", guestIds);
  const { data: tables } = await supabase
    .from("seating_tables")
    .select("id, parent_table_id")
    .eq("event_id", event.id);
  const parentById = new Map((tables ?? []).map((row) => [row.id, row.parent_table_id]));
  const guestTotal = new Map(
    (guests ?? []).map((row) => [row.id, guestPeopleCount(row)]),
  );
  let count = 0;
  for (const row of rows ?? []) {
    const total = guestTotal.get(row.guest_id) ?? 1;
    const seats = (row.seat_ids?.length ? row.seat_ids : [row.table_id]).slice(0, total);
    for (const seatId of seats) {
      const resolved =
        event.event_type === "akad"
          ? seatId
          : parentById.get(seatId) ?? seatId;
      if (resolved === targetId) count += 1;
    }
  }
  return count;
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

export async function renameDinnerTableAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  const name = text(formData, "name").slice(0, 80);

  if (!isUuid(id) || !name) {
    return { error: ctx.copy.form.required };
  }

  // Resolve the event from the table itself. The UI can briefly carry a stale
  // event id after a layout refresh; the table row is the source of truth.
  const { data: table } = await ctx.supabase
    .from("seating_tables")
    .select("id, event_id, capacity, kind")
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!table || Number(table.capacity) <= 1 || table.kind === "chair") {
    return { error: ctx.copy.errors.notFound };
  }

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("event_type")
    .eq("id", table.event_id)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event || event.event_type !== "dinner") {
    return { error: ctx.copy.errors.notFound };
  }

  const { error } = await ctx.supabase
    .from("seating_tables")
    .update({ name })
    .eq("id", id)
    .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.form.saved };
}

export async function generateDinnerLayoutAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "eventId");
  if (!isUuid(eventId)) return { error: ctx.copy.errors.notFound };

  const tableCount = parseCount(text(formData, "tableCount"));
  const chairsPerTable = parseCount(text(formData, "chairsPerTable"));
  const replace = text(formData, "replace") === "1";
  if (
    tableCount === null ||
    chairsPerTable === null ||
    tableCount < 1 ||
    tableCount > 40 ||
    chairsPerTable < 2 ||
    chairsPerTable > 20
  ) {
    return { error: ctx.copy.form.invalidNumber };
  }

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("id, event_type")
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event || event.event_type !== "dinner") {
    return { error: ctx.copy.errors.notFound };
  }

  const { count: assigned, error: assignedError } = await ctx.supabase
    .from("seating_assignments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  if (assignedError) return { error: actionError(assignedError, ctx.copy) };
  if ((assigned ?? 0) > 0 && !replace) {
    return { error: ctx.copy.seating.layoutHasGuests };
  }

  const { data: existingTables, error: existingError } = await ctx.supabase
    .from("seating_tables")
    .select("id")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  if (existingError) return { error: actionError(existingError, ctx.copy) };
  const existingIds = (existingTables ?? []).map((table) => table.id);

  // Keep tables inside the canvas with a 3% breathing gap. Rows start below
  // the bridal table (top) and stop above the entrance marker (bottom).
  const columns = Math.min(tableCount, 6);
  const rows = Math.ceil(tableCount / columns);
  const width = Math.min(13, Math.max(7, 80 / columns - 3));
  const height = Math.min(11, Math.max(5, 52 / rows - 2));
  const gapX = width + 3;
  const rowStart = 27;
  const rowEnd = 82;

  const tables = Array.from({ length: tableCount }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 50 + (column - (columns - 1) / 2) * gapX;
    const y =
      rows === 1 ? 52 : rowStart + (row * (rowEnd - rowStart)) / (rows - 1);

    return {
      wedding_id: ctx.weddingId,
      event_id: eventId,
      name: `Meja ${index + 1}`,
      shape: "round" as const,
      capacity: chairsPerTable,
      canvas_x: Math.min(92, Math.max(8, x)),
      canvas_y: Math.min(86, Math.max(22, y)),
      width,
      height,
      sort_order: index,
      kind: "table" as const,
      side: "none" as const,
      rotation: 0,
      parent_table_id: null,
    };
  });

  let { error } = await ctx.supabase.from("seating_tables").insert(tables);
  if (error?.code === "42703") {
    const fallback = await ctx.supabase.from("seating_tables").insert(
      tables.map((table) => {
        const {
          kind: _kind,
          side: _side,
          rotation: _rotation,
          parent_table_id: _parent,
          ...base
        } = table;
        void _kind;
        void _side;
        void _rotation;
        void _parent;
        return base;
      }),
    );
    error = fallback.error;
  }
  if (error) return { error: actionError(error, ctx.copy) };

  // Only remove the previous rows after the replacement layout has been
  // inserted, so a failed insert does not wipe the current dinner setup.
  if (existingIds.length > 0) {
    const { error: deleteError } = await ctx.supabase
      .from("seating_tables")
      .delete()
      .in("id", existingIds)
      .eq("event_id", eventId)
      .eq("wedding_id", ctx.weddingId);
    if (deleteError) return { error: actionError(deleteError, ctx.copy) };
  }

  await ctx.supabase
    .from("seating_events")
    .update({ stage_x: 50, stage_y: 7 })
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId);

  revalidateSeating();
  return { success: ctx.copy.seating.layoutSaved };
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

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("id, event_type")
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event) return { error: ctx.copy.errors.notFound };

  const { data: targetTable } = await ctx.supabase
    .from("seating_tables")
    .select("id, event_id, capacity, kind, parent_table_id")
    .eq("id", tableId)
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!targetTable) return { error: ctx.copy.errors.notFound };

  const targetTableId =
    event.event_type === "dinner"
      ? targetTable.parent_table_id ?? targetTable.id
      : targetTable.id;

  const { data: targetParent } =
    event.event_type === "dinner" && targetTableId !== targetTable.id
      ? await ctx.supabase
          .from("seating_tables")
          .select("id, capacity, kind")
          .eq("id", targetTableId)
          .eq("event_id", eventId)
          .eq("wedding_id", ctx.weddingId)
          .maybeSingle()
      : { data: targetTable };
  if (!targetParent) return { error: ctx.copy.errors.notFound };

  if (event.event_type === "akad" && Number(targetParent.capacity) !== 1) {
    return { error: ctx.copy.seating.seatTaken };
  }
  if (event.event_type === "dinner" && Number(targetParent.capacity) < 1) {
    return { error: ctx.copy.seating.notEnoughSeats };
  }

  const { data: guest } = await ctx.supabase
    .from("guests")
    .select("id, plus_ones")
    .eq("id", guestId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!guest) return { error: ctx.copy.errors.notFound };

  const totalPax = guestPeopleCount(guest);
  const requestedPax = text(formData, "paxIndex");
  const parsedPax = requestedPax ? parseCount(requestedPax) : null;
  if (requestedPax && (parsedPax === null || parsedPax < 1 || parsedPax > totalPax)) {
    return { error: ctx.copy.form.invalidNumber };
  }

  type AssignmentRow = {
    id: string;
    table_id: string;
    guest_id: string;
    seat_ids?: string[];
  };
  const { data: rows } = await ctx.supabase
    .from("seating_assignments")
    .select("id, table_id, guest_id, seat_ids")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  const allRows = (rows ?? []) as AssignmentRow[];
  const { data: allGuestRows } = await ctx.supabase
    .from("guests")
    .select("id, plus_ones")
    .eq("wedding_id", ctx.weddingId);
  const allGuests = new Map(
    (allGuestRows ?? []).map((row) => [row.id, guestPeopleCount(row)]),
  );
  const { data: allTables } = await ctx.supabase
    .from("seating_tables")
    .select("id, parent_table_id, capacity")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  const tableById = new Map((allTables ?? []).map((row) => [row.id, row]));

  const normalizeTarget = (id: string) => {
    if (event.event_type === "akad") return id;
    const row = tableById.get(id);
    return row?.parent_table_id ?? id;
  };
  const targetsFor = (row: AssignmentRow) => {
    const total = allGuests.get(row.guest_id) ?? 1;
    const raw = row.seat_ids?.length ? row.seat_ids : [row.table_id];
    return raw.map(normalizeTarget).slice(0, total);
  };

  const current = allRows.find((row) => row.guest_id === guestId);
  const currentTargets = current ? targetsFor(current) : [];
  const paxIndex = parsedPax ?? Math.min(currentTargets.length + 1, totalPax);
  if (paxIndex < 1 || paxIndex > totalPax) {
    return { error: ctx.copy.seating.notEnoughSeats };
  }
  if (paxIndex > currentTargets.length + 1) {
    return { error: ctx.copy.seating.notEnoughSeats };
  }

  const counts = new Map<string, number>();
  for (const row of allRows) {
    for (const target of targetsFor(row)) {
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }
  }
  const currentTarget = currentTargets[paxIndex - 1];
  if (currentTarget !== targetTableId) {
    const occupied = counts.get(targetTableId) ?? 0;
    const capacity = Number(targetParent.capacity) || 0;
    if (occupied >= capacity) {
      return { error: ctx.copy.seating.notEnoughSeats };
    }
  }

  const nextTargets = [...currentTargets];
  if (paxIndex <= nextTargets.length) nextTargets[paxIndex - 1] = targetTableId;
  else nextTargets.push(targetTableId);

  const payload = {
    wedding_id: ctx.weddingId,
    event_id: eventId,
    table_id: nextTargets[0],
    guest_id: guestId,
    seat_ids: nextTargets,
  };
  const { error } = current
    ? await ctx.supabase
        .from("seating_assignments")
        .update(payload)
        .eq("id", current.id)
        .eq("wedding_id", ctx.weddingId)
    : await ctx.supabase.from("seating_assignments").insert(payload);

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


export async function swapPaxAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const eventId = text(formData, "eventId");
  const guestA = text(formData, "guestA");
  const guestB = text(formData, "guestB");
  const paxA = parseCount(text(formData, "paxA"));
  const paxB = parseCount(text(formData, "paxB"));
  if (
    !isUuid(eventId) ||
    !isUuid(guestA) ||
    !isUuid(guestB) ||
    guestA === guestB ||
    paxA === null ||
    paxB === null ||
    paxA < 1 ||
    paxB < 1
  ) {
    return { error: ctx.copy.errors.notFound };
  }

  const { data: event } = await ctx.supabase
    .from("seating_events")
    .select("id, event_type")
    .eq("id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!event) return { error: ctx.copy.errors.notFound };

  const { data: tables } = await ctx.supabase
    .from("seating_tables")
    .select("id, parent_table_id")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId);
  const parentById = new Map(
    (tables ?? []).map((row) => [row.id, row.parent_table_id]),
  );
  const normalize = (id: string) =>
    event.event_type === "akad" ? id : parentById.get(id) ?? id;

  type Row = { id: string; guest_id: string; table_id: string; seat_ids?: string[] };
  const { data: rows } = await ctx.supabase
    .from("seating_assignments")
    .select("id, guest_id, table_id, seat_ids")
    .eq("event_id", eventId)
    .eq("wedding_id", ctx.weddingId)
    .in("guest_id", [guestA, guestB]);
  const a = (rows ?? []).find((row) => row.guest_id === guestA) as Row | undefined;
  const b = (rows ?? []).find((row) => row.guest_id === guestB) as Row | undefined;
  if (!a || !b) return { error: ctx.copy.seating.swapNeedsBoth };

  const seatsA = (a.seat_ids?.length ? a.seat_ids : [a.table_id]).map(normalize);
  const seatsB = (b.seat_ids?.length ? b.seat_ids : [b.table_id]).map(normalize);
  if (paxA > seatsA.length || paxB > seatsB.length) {
    return { error: ctx.copy.errors.notFound };
  }
  [seatsA[paxA - 1], seatsB[paxB - 1]] = [seatsB[paxB - 1], seatsA[paxA - 1]];

  const first = await ctx.supabase
    .from("seating_assignments")
    .update({ table_id: seatsA[0], seat_ids: seatsA })
    .eq("id", a.id)
    .eq("wedding_id", ctx.weddingId);
  if (first.error) return { error: actionError(first.error, ctx.copy) };

  const second = await ctx.supabase
    .from("seating_assignments")
    .update({ table_id: seatsB[0], seat_ids: seatsB })
    .eq("id", b.id)
    .eq("wedding_id", ctx.weddingId);
  if (second.error) {
    await ctx.supabase
      .from("seating_assignments")
      .update({ table_id: a.table_id, seat_ids: a.seat_ids ?? [] })
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

  const paxRaw = text(formData, "paxIndex");
  const paxIndex = paxRaw ? parseCount(paxRaw) : null;
  if (paxRaw && (paxIndex === null || paxIndex < 1)) {
    return { error: ctx.copy.form.invalidNumber };
  }

  const { data: current } = await ctx.supabase
    .from("seating_assignments")
    .select("id, table_id, seat_ids")
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .eq("wedding_id", ctx.weddingId)
    .maybeSingle();
  if (!current) return { success: ctx.copy.seating.removed };

  if (!paxIndex) {
    const { error } = await ctx.supabase
      .from("seating_assignments")
      .delete()
      .eq("id", current.id)
      .eq("wedding_id", ctx.weddingId);
    if (error) return { error: actionError(error, ctx.copy) };
    revalidateSeating();
    return { success: ctx.copy.seating.removed };
  }

  const seats = current.seat_ids?.length ? [...current.seat_ids] : [current.table_id];
  if (paxIndex > seats.length) {
    return { error: ctx.copy.errors.notFound };
  }
  seats.splice(paxIndex - 1, 1);

  const { error } = seats.length > 0
    ? await ctx.supabase
        .from("seating_assignments")
        .update({ table_id: seats[0], seat_ids: seats })
        .eq("id", current.id)
        .eq("wedding_id", ctx.weddingId)
    : await ctx.supabase
        .from("seating_assignments")
        .delete()
        .eq("id", current.id)
        .eq("wedding_id", ctx.weddingId);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateSeating();
  return { success: ctx.copy.seating.removed };
}
