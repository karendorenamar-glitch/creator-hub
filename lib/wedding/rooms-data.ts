import type { Guest, Room, RoomAssignment } from "@/lib/wedding/db-types";
import { createWeddingClient } from "@/lib/wedding/supabase";

function isMissingTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.toLowerCase().includes("could not find the table") === true
  );
}

export type RoomsPageData = {
  rooms: Room[];
  assignments: RoomAssignment[];
  guests: Guest[];
  migrationRequired: boolean;
  loadError: boolean;
};

export async function loadRoomsData(weddingId: string): Promise<RoomsPageData> {
  const supabase = await createWeddingClient();
  const [roomsResult, assignmentsResult, guestsResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name", { ascending: true }),
    supabase
      .from("room_assignments")
      .select("*")
      .eq("wedding_id", weddingId),
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
  ]);

  const firstError =
    roomsResult.error ?? assignmentsResult.error ?? guestsResult.error;

  return {
    rooms: roomsResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    guests: guestsResult.data ?? [],
    migrationRequired: firstError ? isMissingTable(firstError) : false,
    loadError: Boolean(firstError && firstError.code !== "42P01"),
  };
}
