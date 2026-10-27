import type {
  Guest,
  SeatingAssignment,
  SeatingEvent,
  SeatingEventType,
  SeatingTable,
} from "@/lib/wedding/db-types";
import { createWeddingClient } from "@/lib/wedding/supabase";

const DEFAULT_EVENTS: { event_type: SeatingEventType; name: string }[] = [
  { event_type: "akad", name: "Akad / Ceremony" },
  { event_type: "dinner", name: "Dinner Reception" },
];

function isMissingTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.toLowerCase().includes("could not find the table") === true
  );
}

export type SeatingPageData = {
  events: SeatingEvent[];
  tables: SeatingTable[];
  assignments: SeatingAssignment[];
  guests: Guest[];
  migrationRequired: boolean;
  loadError: boolean;
};

export async function loadSeatingData(
  weddingId: string,
): Promise<SeatingPageData> {
  const supabase = await createWeddingClient();

  const initial = await supabase
    .from("seating_events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("event_type", { ascending: true });

  if (initial.error) {
    return {
      events: [],
      tables: [],
      assignments: [],
      guests: [],
      migrationRequired: isMissingTable(initial.error),
      loadError: initial.error.code !== "42P01",
    };
  }

  let events = initial.data ?? [];
  const existingTypes = new Set(events.map((event) => event.event_type));
  const missing = DEFAULT_EVENTS.filter(
    (event) => !existingTypes.has(event.event_type),
  );

  if (missing.length > 0) {
    const { error: insertError } = await supabase
      .from("seating_events")
      .insert(missing.map((event) => ({ ...event, wedding_id: weddingId })));

    if (insertError) {
      return {
        events,
        tables: [],
        assignments: [],
        guests: [],
        migrationRequired: isMissingTable(insertError),
        loadError: insertError.code !== "42P01",
      };
    }

    const refreshed = await supabase
      .from("seating_events")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("event_type", { ascending: true });
    events = refreshed.data ?? events;
  }

  const [tablesResult, assignmentsResult, guestsResult] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("seating_assignments")
      .select("*")
      .eq("wedding_id", weddingId),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
  ]);

  let tables = tablesResult.data ?? [];
  const akadEvent = events.find((event) => event.event_type === "akad");
  const dinnerEvent = events.find((event) => event.event_type === "dinner");
  const akadTables = akadEvent
    ? tables.filter((table) => table.event_id === akadEvent.id)
    : [];
  const hasIndividualChairs = akadTables.some(
    (table) => table.kind === "chair" || table.capacity === 1,
  );
  let didInsertSeats = false;

  type NewSeat = {
    wedding_id: string;
    event_id: string;
    name: string;
    shape: "round" | "rect";
    capacity: number;
    canvas_x: number;
    canvas_y: number;
    width: number;
    height: number;
    sort_order: number;
    kind: "chair";
    side: "left" | "right" | "none";
    rotation: number;
    parent_table_id: string | null;
  };

  const baseSeat = (seat: NewSeat) => {
    const { kind, side, rotation, parent_table_id, ...base } = seat;
    void kind;
    void side;
    void rotation;
    void parent_table_id;
    return base;
  };

  // Akad is a chair-only layout. Give every chair its own row so it has a
  // unique ID, independent position, rotation and guest assignment.
  if (akadEvent && !hasIndividualChairs) {
    const assignedTableIds = new Set(
      (assignmentsResult.data ?? []).map((assignment) => assignment.table_id),
    );
    const emptyLegacyIds = akadTables
      .filter((table) => table.capacity > 1 && !assignedTableIds.has(table.id))
      .map((table) => table.id);
    if (emptyLegacyIds.length > 0) {
      await supabase.from("seating_tables").delete().in("id", emptyLegacyIds);
    }

    const chairs: NewSeat[] = [];
    let order = 0;
    for (const side of ["left", "right"] as const) {
      for (let row = 0; row < 5; row += 1) {
        for (let seat = 0; seat < 5; seat += 1) {
          const x = side === "left" ? 18 + seat * 5.5 : 82 - seat * 5.5;
          chairs.push({
            wedding_id: weddingId,
            event_id: akadEvent.id,
            name: `${side === "left" ? "L" : "R"}${row * 5 + seat + 1}`,
            shape: "rect",
            capacity: 1,
            canvas_x: x,
            canvas_y: 20 + row * 14,
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
    }
    let { error: chairError } = await supabase
      .from("seating_tables")
      .insert(chairs);
    if (chairError?.code === "42703") {
      const fallback = await supabase
        .from("seating_tables")
        .insert(chairs.map(baseSeat));
      chairError = fallback.error;
    }
    didInsertSeats = !chairError;
  }

  // Dinner tables also get individual seats around the table. The table row
  // stays as the visual table, while every chair is an independently movable
  // seating object. Existing table-level assignments stay untouched.
  if (dinnerEvent) {
    const dinnerTables = tables.filter(
      (table) => table.event_id === dinnerEvent.id && table.capacity > 1,
    );
    const dinnerChairs = tables.filter(
      (table) => table.event_id === dinnerEvent.id && table.capacity === 1,
    );
    const fallbackParentIds = new Set<string>();

    // Chairs created before migration 034 have no parent_table_id. Reconnect
    // them by their generated name so the table can be edited/deleted safely.
    const unparented = dinnerChairs.filter((chair) => !chair.parent_table_id);
    for (const chair of unparented) {
      const parent = dinnerTables.find((table) =>
        chair.name.startsWith(`${table.name} · `),
      );
      if (!parent) continue;
      const { error: parentError } = await supabase
        .from("seating_tables")
        .update({ parent_table_id: parent.id })
        .eq("id", chair.id)
        .eq("wedding_id", weddingId);
      if (parentError?.code === "42703") {
        fallbackParentIds.add(parent.id);
        continue;
      }
      if (!parentError) chair.parent_table_id = parent.id;
    }

    const parentsWithChairs = new Set(
      [
        ...dinnerChairs
          .map((table) => table.parent_table_id)
          .filter((value): value is string => Boolean(value)),
        ...fallbackParentIds,
      ],
    );
    const seats: NewSeat[] = [];
    {
      for (const table of dinnerTables) {
        if (parentsWithChairs.has(table.id)) continue;
        const count = Math.max(1, Math.min(30, table.capacity));
        const radiusX = Math.max(7, table.width * 0.6);
        const radiusY = Math.max(7, table.height * 0.75);
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
          const x = table.canvas_x + Math.cos(angle) * radiusX;
          const y = table.canvas_y + Math.sin(angle) * radiusY;
          seats.push({
            wedding_id: weddingId,
            event_id: dinnerEvent.id,
            name: `${table.name} · ${index + 1}`,
            shape: "round",
            capacity: 1,
            canvas_x: Math.min(96, Math.max(4, x)),
            canvas_y: Math.min(96, Math.max(4, y)),
            width: 4.5,
            height: 6,
            sort_order: table.sort_order * 100 + index,
            kind: "chair",
            side: "none",
            rotation: (angle * 180) / Math.PI + 90,
            parent_table_id: table.id,
          });
        }
      }
    }
    if (seats.length > 0) {
      let { error: seatError } = await supabase
        .from("seating_tables")
        .insert(seats);
      if (seatError?.code === "42703") {
        const fallback = await supabase
          .from("seating_tables")
          .insert(seats.map(baseSeat));
        seatError = fallback.error;
      }
      didInsertSeats = didInsertSeats || !seatError;
    }
  }

  if (didInsertSeats) {
    const refreshedTables = await supabase
      .from("seating_tables")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    tables = refreshedTables.data ?? tables;
  }

  const firstError =
    tablesResult.error ?? assignmentsResult.error ?? guestsResult.error;

  return {
    events,
    tables,
    assignments: assignmentsResult.data ?? [],
    guests: guestsResult.data ?? [],
    migrationRequired: firstError ? isMissingTable(firstError) : false,
    loadError: Boolean(firstError && firstError.code !== "42P01"),
  };
}
