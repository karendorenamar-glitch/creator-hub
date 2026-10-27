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
  const akadTables = akadEvent
    ? tables.filter((table) => table.event_id === akadEvent.id)
    : [];
  const hasIndividualChairs = akadTables.some((table) => table.capacity === 1);

  // Akad is a chair-only layout. Give every chair its own seating-table row so
  // it has a unique ID, independent position and independent guest assignment.
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

    const chairs = [] as Array<{
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
    }>;
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
          });
        }
      }
    }
    const { error: chairError } = await supabase
      .from("seating_tables")
      .insert(chairs);
    if (!chairError) {
      const refreshedTables = await supabase
        .from("seating_tables")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      tables = refreshedTables.data ?? tables;
    }
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
