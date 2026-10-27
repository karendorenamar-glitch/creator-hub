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

  const firstError =
    tablesResult.error ?? assignmentsResult.error ?? guestsResult.error;

  return {
    events,
    tables: tablesResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    guests: guestsResult.data ?? [],
    migrationRequired: firstError ? isMissingTable(firstError) : false,
    loadError: Boolean(firstError && firstError.code !== "42P01"),
  };
}
