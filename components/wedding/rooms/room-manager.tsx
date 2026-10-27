"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { BedDouble, Plus, Search, UserMinus } from "lucide-react";
import {
  assignRoomGuestAction,
  deleteRoomAction,
  removeRoomGuestAction,
  saveRoomAction,
} from "@/app/wedding/(app)/rooms/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge, Card, StatCard } from "@/components/wedding/ui";
import type {
  BreakfastType,
  Guest,
  Room,
  RoomAssignment,
  RoomType,
} from "@/lib/wedding/db-types";
import { guestPeopleCount } from "@/lib/wedding/guest-count";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

type RoomFilter =
  | "all"
  | "available"
  | "full"
  | "included"
  | "none"
  | "unconfigured";

function roomTypeLabel(type: RoomType, copy: ModuleCopy) {
  return {
    single: copy.rooms.roomTypeSingle,
    twin: copy.rooms.roomTypeTwin,
    double: copy.rooms.roomTypeDouble,
    suite: copy.rooms.roomTypeSuite,
    custom: copy.rooms.roomTypeCustom,
  }[type];
}

function breakfastLabel(room: Room, copy: ModuleCopy) {
  if (room.breakfast_type === "none") return copy.rooms.breakfastNone;
  if (room.breakfast_type === "unconfigured") {
    return copy.rooms.breakfastUnconfigured;
  }
  if (room.breakfast_type === "included") {
    return room.breakfast_pax === null
      ? copy.rooms.breakfastUnknown
      : `${copy.rooms.breakfastIncluded} · ${room.breakfast_pax} pax`;
  }
  return room.breakfast_pax === null
    ? `${copy.rooms.breakfastCustom} · ${copy.rooms.breakfastUnknown}`
    : `${copy.rooms.breakfastCustom} · ${room.breakfast_pax} pax`;
}


function RoomFormModal({
  open,
  onClose,
  copy,
  room,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  room: Room | null;
}) {
  const [state, formAction, pending] = useActionState(saveRoomAction, null);
  const [breakfastType, setBreakfastType] = useState<BreakfastType>(
    room?.breakfast_type ?? "unconfigured",
  );
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 2));
  const [pax, setPax] = useState(
    room?.breakfast_pax === null || room?.breakfast_pax === undefined
      ? ""
      : String(room.breakfast_pax),
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  const paxNumber = pax ? Number(pax) : null;
  const paxWarning =
    paxNumber !== null && Number.isFinite(paxNumber) && paxNumber > Number(capacity);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      wide
      title={room ? copy.rooms.edit : copy.rooms.add}
    >
      <form action={formAction} className="space-y-4">
        {room ? <input type="hidden" name="id" value={room.id} /> : null}
        <FormAlert error={state?.error} success={state?.success} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.rooms.name} htmlFor="room-name">
            <input id="room-name" name="name" required maxLength={80} defaultValue={room?.name ?? ""} className={inputClass} />
          </Field>
          <Field label={`${copy.rooms.hotel} (${copy.form.optional})`} htmlFor="room-hotel">
            <input id="room-hotel" name="hotelName" maxLength={120} defaultValue={room?.hotel_name ?? ""} className={inputClass} />
          </Field>
          <Field label={copy.rooms.type} htmlFor="room-type">
            <select id="room-type" name="roomType" defaultValue={room?.room_type ?? "double"} className={inputClass}>
              {(["single", "twin", "double", "suite", "custom"] as const).map((type) => (
                <option key={type} value={type}>{roomTypeLabel(type, copy)}</option>
              ))}
            </select>
          </Field>
          <Field label={copy.rooms.capacity} htmlFor="room-capacity">
            <input id="room-capacity" name="capacity" type="number" min={0} max={20} required value={capacity} onChange={(event) => setCapacity(event.target.value)} className={inputClass} />
          </Field>
          <Field label={copy.rooms.checkIn} htmlFor="room-check-in">
            <input id="room-check-in" name="checkIn" type="date" defaultValue={room?.check_in ?? ""} className={inputClass} />
          </Field>
          <Field label={copy.rooms.checkOut} htmlFor="room-check-out">
            <input id="room-check-out" name="checkOut" type="date" defaultValue={room?.check_out ?? ""} className={inputClass} />
          </Field>
        </div>

        <div className="space-y-3 rounded-2xl border border-olive-100 bg-olive-50/35 p-3">
          <Field label={copy.rooms.breakfast} htmlFor="room-breakfast">
            <select id="room-breakfast" name="breakfastType" value={breakfastType} onChange={(event) => setBreakfastType(event.target.value as BreakfastType)} className={inputClass}>
              <option value="unconfigured">{copy.rooms.breakfastUnconfigured}</option>
              <option value="none">{copy.rooms.breakfastNone}</option>
              <option value="included">{copy.rooms.breakfastIncluded}</option>
              <option value="custom">{copy.rooms.breakfastCustom}</option>
            </select>
          </Field>
          {breakfastType !== "none" && breakfastType !== "unconfigured" ? (
            <Field label={copy.rooms.breakfastPax} htmlFor="room-breakfast-pax">
              <input id="room-breakfast-pax" name="breakfastPax" type="number" min={0} max={20} required={breakfastType === "included"} value={pax} onChange={(event) => setPax(event.target.value)} className={inputClass} />
            </Field>
          ) : null}
          {breakfastType === "custom" ? (
            <Field label={copy.rooms.breakfastNotes} htmlFor="room-breakfast-notes">
              <textarea id="room-breakfast-notes" name="breakfastNotes" rows={2} maxLength={500} defaultValue={room?.breakfast_notes ?? ""} className={inputClass} />
            </Field>
          ) : null}
          {paxWarning ? (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <input type="checkbox" name="breakfastOverride" value="1" className="mt-0.5" />
              <span>{copy.rooms.breakfastOverride}</span>
            </label>
          ) : null}
        </div>

        <Field label={`${copy.rooms.notes} (${copy.form.optional})`} htmlFor="room-notes">
          <textarea id="room-notes" name="notes" rows={2} maxLength={1000} defaultValue={room?.notes ?? ""} className={inputClass} />
        </Field>

        <ModalFooter pending={pending} submitLabel={copy.rooms.save} savingLabel={copy.form.saving} cancelLabel={copy.form.cancel} onCancel={onClose} />
      </form>
    </FormModal>
  );
}




function AssignRoomGuestModal({
  room,
  onClose,
  copy,
  guests,
  assignments,
  roomById,
}: {
  room: Room | null;
  onClose: () => void;
  copy: ModuleCopy;
  guests: Guest[];
  assignments: RoomAssignment[];
  roomById: Map<string, Room>;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const assignmentByGuest = useMemo(
    () => new Map(assignments.map((item) => [item.guest_id, item])),
    [assignments],
  );

  const available = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guests.filter((guest) => {
      if (!needle) return true;
      return [guest.name, guest.guest_group, guest.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [guests, query]);

  async function assign(guestId: string) {
    if (!room || busy) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("roomId", room.id);
      formData.set("guestId", guestId);
      const result = await assignRoomGuestAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal
      open={Boolean(room)}
      onClose={onClose}
      title={room ? `${copy.rooms.addGuest}: ${room.name}` : copy.rooms.addGuest}
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.rooms.searchGuest} className={`${inputClass} pl-9`} />
        </div>
        {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {available.length === 0 ? (
            <p className="rounded-xl border border-dashed border-olive-200 px-3 py-5 text-center text-sm text-ink-soft">{copy.rooms.noAssignable}</p>
          ) : (
            available.map((guest) => {
              const current = assignmentByGuest.get(guest.id);
              const currentRoom = current ? roomById.get(current.room_id) : null;
              if (room && current?.room_id === room.id) return null;
              return (
                <button key={guest.id} type="button" disabled={busy} onClick={() => void assign(guest.id)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-olive-100 px-3 py-2 text-left hover:border-petal-200 hover:bg-petal-50/40 disabled:opacity-60">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{guest.name}</span>
                    <span className="block truncate text-xs text-ink-soft">{guest.guest_group || "—"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {currentRoom ? currentRoom.name : `${guestPeopleCount(guest)} pax`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </FormModal>
  );
}



export function RoomManager({
  rooms,
  assignments,
  guests,
  copy,
}: {
  rooms: Room[];
  assignments: RoomAssignment[];
  guests: Guest[];
  copy: ModuleCopy;
}) {
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [query, setQuery] = useState("");
  const [roomModal, setRoomModal] = useState<{ open: boolean; editing: Room | null }>({
    open: false,
    editing: null,
  });
  const [assignRoom, setAssignRoom] = useState<Room | null>(null);

  const guestById = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest])),
    [guests],
  );
  const roomById = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );
  const assignmentsByRoom = useMemo(() => {
    const map = new Map<string, RoomAssignment[]>();
    for (const assignment of assignments) {
      const bucket = map.get(assignment.room_id) ?? [];
      bucket.push(assignment);
      map.set(assignment.room_id, bucket);
    }
    return map;
  }, [assignments]);
  const peopleByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const assignment of assignments) {
      const guest = guestById.get(assignment.guest_id);
      if (!guest) continue;
      map.set(
        assignment.room_id,
        (map.get(assignment.room_id) ?? 0) + guestPeopleCount(guest),
      );
    }
    return map;
  }, [assignments, guestById]);

  const assignedPeople = useMemo(
    () =>
      assignments.reduce((sum, assignment) => {
        const guest = guestById.get(assignment.guest_id);
        return guest ? sum + guestPeopleCount(guest) : sum;
      }, 0),
    [assignments, guestById],
  );
  const totalCapacity = rooms.reduce(
    (sum, room) => sum + Math.max(0, Number(room.capacity) || 0),
    0,
  );
  const breakfastEntitlements = rooms.reduce((sum, room) => {
    if (room.breakfast_type !== "included" && room.breakfast_type !== "custom") {
      return sum;
    }
    return sum + Math.max(0, room.breakfast_pax ?? 0);
  }, 0);
  const roomsWithoutBreakfast = rooms.filter(
    (room) => room.breakfast_type === "none",
  ).length;
  const breakfastUnconfigured = rooms.filter(
    (room) =>
      room.breakfast_type === "unconfigured" ||
      (room.breakfast_type === "custom" && room.breakfast_pax === null),
  ).length;

  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms.filter((room) => {
      if (
        needle &&
        ![room.name, room.hotel_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      const occupancy = peopleByRoom.get(room.id) ?? 0;
      if (filter === "available" && occupancy >= room.capacity) return false;
      if (filter === "full" && occupancy < room.capacity) return false;
      if (filter === "included" && room.breakfast_type !== "included") return false;
      if (filter === "none" && room.breakfast_type !== "none") return false;
      if (
        filter === "unconfigured" &&
        !(
          room.breakfast_type === "unconfigured" ||
          (room.breakfast_type === "custom" && room.breakfast_pax === null)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [rooms, query, filter, peopleByRoom]);

  async function removeGuest(room: Room, guestId: string) {
    const formData = new FormData();
    formData.set("roomId", room.id);
    formData.set("guestId", guestId);
    await removeRoomGuestAction(formData);
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={copy.rooms.totalRooms} value={String(rooms.length)} />
        <StatCard label={copy.rooms.totalCapacity} value={String(totalCapacity)} />
        <StatCard label={copy.rooms.assignedGuests} value={String(assignedPeople)} tone="champagne" />
        <StatCard label={copy.rooms.availableSpaces} value={String(Math.max(0, totalCapacity - assignedPeople))} />
        <StatCard label={copy.rooms.breakfastEntitlements} value={String(breakfastEntitlements)} hint={`${breakfastUnconfigured} ${copy.rooms.breakfastUnconfiguredCount.toLowerCase()}`} />
        <StatCard label={copy.rooms.roomsWithoutBreakfast} value={String(roomsWithoutBreakfast)} tone="neutral" />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.rooms.searchGuest} className={`${inputClass} pl-9`} />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as RoomFilter)} aria-label={copy.rooms.title} className={`${inputClass} w-auto min-w-44`}>
          <option value="all">{copy.rooms.filterAll}</option>
          <option value="available">{copy.rooms.filterAvailable}</option>
          <option value="full">{copy.rooms.filterFull}</option>
          <option value="included">{copy.rooms.filterIncluded}</option>
          <option value="none">{copy.rooms.filterNone}</option>
          <option value="unconfigured">{copy.rooms.filterUnconfigured}</option>
        </select>
        <button type="button" onClick={() => setRoomModal({ open: true, editing: null })} className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700">
          <Plus className="size-4" aria-hidden />
          {copy.rooms.add}
        </button>
      </div>

      {rooms.length === 0 ? (
        <Card className="border-dashed border-olive-200 bg-cream/60">
          <p className="text-center text-sm text-ink-soft">{copy.rooms.noRooms} {copy.rooms.noRoomsHint}</p>
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card className="border-dashed border-olive-200 bg-cream/60">
          <p className="text-center text-sm text-ink-soft">{copy.guests.emptyFilter}</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredRooms.map((room) => {
            const occupancy = peopleByRoom.get(room.id) ?? 0;
            const full = occupancy >= room.capacity;
            const roomGuests = (assignmentsByRoom.get(room.id) ?? [])
              .map((assignment) => guestById.get(assignment.guest_id))
              .filter((guest): guest is Guest => Boolean(guest));
            return (
              <Card key={room.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-lg font-semibold text-ink">{room.name}</p>
                    <p className="text-xs text-ink-soft">{roomTypeLabel(room.room_type, copy)}{room.hotel_name ? ` · ${room.hotel_name}` : ""}</p>
                  </div>
                  <Badge tone={full ? "success" : occupancy > 0 ? "warning" : "muted"}>{full ? copy.rooms.full : occupancy > 0 ? copy.rooms.partial : copy.rooms.available}</Badge>
                </div>

                <div>
                  <p className="text-sm text-ink">{copy.rooms.occupancy}: {occupancy} / {room.capacity}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-petal-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-petal-300 to-olive-400" style={{ width: `${Math.min(100, room.capacity > 0 ? (occupancy / room.capacity) * 100 : 0)}%` }} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">{copy.rooms.guests}</p>
                  {roomGuests.length === 0 ? (
                    <p className="mt-1 text-sm text-ink-soft">{copy.rooms.noGuests}</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {roomGuests.map((guest) => (
                        <div key={guest.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate text-ink">{guest.name} <span className="text-xs text-ink-soft">({guestPeopleCount(guest)} pax)</span></span>
                          <button type="button" onClick={() => void removeGuest(room, guest.id)} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline">
                            <UserMinus className="size-3.5" aria-hidden />
                            {copy.rooms.removeGuest}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-olive-50/60 px-3 py-2 text-sm text-ink">
                  <span className="font-medium">{copy.rooms.breakfast}:</span> {breakfastLabel(room, copy)}
                  {room.breakfast_type !== "none" && room.breakfast_type !== "unconfigured" && room.breakfast_pax !== null && room.breakfast_pax > room.capacity ? (
                    <p className="mt-1 text-xs text-amber-700">{copy.rooms.breakfastOverCapacity}</p>
                  ) : null}
                </div>

                {(room.check_in || room.check_out) ? (
                  <p className="text-xs text-ink-soft">{copy.rooms.checkIn}: {room.check_in || "—"} · {copy.rooms.checkOut}: {room.check_out || "—"}</p>
                ) : null}

                {room.breakfast_notes ? (
                  <p className="text-xs text-ink-soft">{copy.rooms.breakfastNotes}: {room.breakfast_notes}</p>
                ) : null}

                {room.notes ? (
                  <p className="text-xs text-ink-soft">{copy.rooms.notes}: {room.notes}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-olive-100 pt-2">
                  <button type="button" onClick={() => setAssignRoom(room)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-olive-700 hover:bg-olive-50">
                    <BedDouble className="size-3.5" aria-hidden />
                    {copy.rooms.addGuest}
                  </button>
                  <button type="button" onClick={() => setRoomModal({ open: true, editing: room })} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50">{copy.form.edit}</button>
                  <DeleteForm action={deleteRoomAction} id={room.id} copy={copy} confirmMessage={copy.rooms.deleteConfirm} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RoomFormModal
        key={roomModal.editing?.id ?? "new-room"}
        open={roomModal.open}
        onClose={() => setRoomModal({ open: false, editing: null })}
        copy={copy}
        room={roomModal.editing}
      />
      <AssignRoomGuestModal
        key={assignRoom?.id ?? "no-assignment"}
        room={assignRoom}
        onClose={() => setAssignRoom(null)}
        copy={copy}
        guests={guests}
        assignments={assignments}
        roomById={roomById}
      />
    </div>
  );
}
