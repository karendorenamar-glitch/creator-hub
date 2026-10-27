"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useActionState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  assignGuestAction,
  deleteTableAction,
  generateAkadChairsAction,
  moveStageAction,
  moveTableAction,
  saveEventAction,
  saveTableAction,
  swapSeatGuestsAction,
  unassignGuestAction,
} from "@/app/wedding/(app)/seating/actions";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { DeleteForm } from "@/components/wedding/delete-form";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge, Card, StatCard } from "@/components/wedding/ui";
import type {
  Guest,
  SeatingAssignment,
  SeatingEvent,
  SeatingTable,
} from "@/lib/wedding/db-types";
import { guestPeopleCount, guestSideOf } from "@/lib/wedding/guest-count";
import { seatingStats } from "@/lib/wedding/seating-calc";
import { label } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

type TableModalState = {
  open: boolean;
  editing: SeatingTable | null;
};

function TableFormModal({
  open,
  onClose,
  copy,
  eventId,
  table,
  mode,
  defaultY,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  eventId: string;
  table: SeatingTable | null;
  mode: "chairs" | "tables";
  defaultY?: number;
}) {
  const [state, formAction, pending] = useActionState(saveTableAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        mode === "chairs"
          ? table
            ? copy.seating.editRow
            : copy.seating.addRow
          : table
            ? copy.seating.editTable
            : copy.seating.addTable
      }
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="kind" value={mode === "chairs" ? "chair" : "table"} />
        {table ? <input type="hidden" name="id" value={table.id} /> : null}
        <input type="hidden" name="x" value={table?.canvas_x ?? 50} />
        <input
          type="hidden"
          name="y"
          value={table?.canvas_y ?? defaultY ?? 50}
        />
        {mode === "chairs" ? (
          <>
            <input type="hidden" name="shape" value="rect" />
            <input type="hidden" name="width" value="4.5" />
            <input type="hidden" name="height" value="6" />
          </>
        ) : null}
        <FormAlert error={state?.error} success={state?.success} />
        <Field
          label={mode === "chairs" ? copy.seating.rowName : copy.seating.tableName}
          htmlFor="seating-table-name"
        >
          <input
            id="seating-table-name"
            name="name"
            required
            maxLength={80}
            defaultValue={table?.name ?? ""}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "tables" ? (
          <Field label={copy.seating.tableShape} htmlFor="seating-table-shape">
            <select
              id="seating-table-shape"
              name="shape"
              defaultValue={table?.shape ?? "round"}
              className={inputClass}
            >
              <option value="round">{copy.seating.round}</option>
              <option value="rect">{copy.seating.rect}</option>
            </select>
          </Field>
          ) : null}
          <Field
            label={
              mode === "chairs" ? copy.seating.rowCapacity : copy.seating.capacity
            }
            htmlFor="seating-table-capacity"
          >
            <input
              id="seating-table-capacity"
              name="capacity"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={table?.capacity ?? (mode === "chairs" ? 1 : 8)}
              readOnly={mode === "chairs"}
              className={inputClass}
            />
          </Field>
          {mode === "chairs" ? (
            <Field label={copy.seating.rotation} htmlFor="seating-chair-rotation">
              <input
                id="seating-chair-rotation"
                name="rotation"
                type="number"
                min={0}
                max={360}
                step={1}
                defaultValue={table?.rotation ?? 0}
                className={inputClass}
              />
            </Field>
          ) : null}
          {mode === "tables" ? (
            <>
              <input type="hidden" name="width" value={table?.width ?? 12} />
              <input type="hidden" name="height" value={table?.height ?? 12} />
            </>
          ) : null}
        </div>
        <ModalFooter
          pending={pending}
          submitLabel={copy.seating.saveTable}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

function ChairLayoutModal({
  open,
  onClose,
  copy,
  eventId,
}: {
  open: boolean;
  onClose: () => void;
  copy: ModuleCopy;
  eventId: string;
}) {
  const [state, formAction, pending] = useActionState(
    generateAkadChairsAction,
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <FormModal open={open} onClose={onClose} title={copy.seating.manageChairs}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <FormAlert error={state?.error} success={state?.success} />
        <p className="text-sm text-ink-soft">{copy.seating.layoutHasGuests}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={copy.seating.leftChairs} htmlFor="akad-left-chairs">
            <input
              id="akad-left-chairs"
              name="left"
              type="number"
              min={0}
              max={100}
              defaultValue={25}
              className={inputClass}
            />
          </Field>
          <Field label={copy.seating.rightChairs} htmlFor="akad-right-chairs">
            <input
              id="akad-right-chairs"
              name="right"
              type="number"
              min={0}
              max={100}
              defaultValue={25}
              className={inputClass}
            />
          </Field>
          <Field label={copy.seating.chairRowsLabel} htmlFor="akad-chair-rows">
            <input
              id="akad-chair-rows"
              name="rows"
              type="number"
              min={1}
              max={20}
              defaultValue={5}
              className={inputClass}
            />
          </Field>
        </div>
        <ModalFooter
          pending={pending}
          submitLabel={copy.form.save}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

function EventSettings({
  event,
  copy,
}: {
  event: SeatingEvent;
  copy: ModuleCopy;
}) {
  const [state, formAction, pending] = useActionState(saveEventAction, null);

  return (
    <Card className="border-olive-100 bg-white/70">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={event.id} />
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
          {copy.seating.saveEvent}
        </p>
        <FormAlert error={state?.error} success={state?.success} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={copy.seating.eventName} htmlFor="seating-event-name">
            <input
              id="seating-event-name"
              name="name"
              required
              maxLength={80}
              defaultValue={event.name}
              className={inputClass}
            />
          </Field>
          <Field label={copy.seating.eventDate} htmlFor="seating-event-date">
            <input
              id="seating-event-date"
              name="eventDate"
              type="date"
              defaultValue={event.event_date ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label={copy.seating.startTime} htmlFor="seating-event-time">
            <input
              id="seating-event-time"
              name="startTime"
              type="time"
              defaultValue={event.start_time?.slice(0, 5) ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
        >
          {pending ? copy.form.saving : copy.seating.saveEvent}
        </button>
      </form>
    </Card>
  );
}

export function SeatingPlanner({
  events,
  tables,
  assignments,
  guests,
  copy,
  locale,
}: {
  events: SeatingEvent[];
  tables: SeatingTable[];
  assignments: SeatingAssignment[];
  guests: Guest[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? events[0];
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "bride" | "groom">("all");
  const [tableModal, setTableModal] = useState<TableModalState>({
    open: false,
    editing: null,
  });
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [zoom, setZoom] = useState(selectedEvent?.zoom ?? 1);
  const [pan, setPan] = useState({
    x: selectedEvent?.pan_x ?? 0,
    y: selectedEvent?.pan_y ?? 0,
  });
  const [stagePos, setStagePos] = useState({
    x: selectedEvent?.stage_x ?? 50,
    y: selectedEvent?.stage_y ?? 7,
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const panDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const stageDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const localTables = useMemo(
    () =>
      tables.map((table) => {
        const position = positions[table.id];
        return position
          ? { ...table, canvas_x: position.x, canvas_y: position.y }
          : table;
      }),
    [tables, positions],
  );

  const eventTables = useMemo(
    () => localTables.filter((table) => table.event_id === selectedEvent?.id),
    [localTables, selectedEvent?.id],
  );
  const eventAssignments = useMemo(
    () => assignments.filter((item) => item.event_id === selectedEvent?.id),
    [assignments, selectedEvent?.id],
  );
  const isCeremony = selectedEvent?.event_type === "akad";
  const chairs = useMemo(
    () =>
      eventTables.filter(
        (table) => table.kind === "chair" || table.capacity === 1,
      ),
    [eventTables],
  );
  const tableObjects = useMemo(
    () => eventTables.filter((table) => !chairs.some((chair) => chair.id === table.id)),
    [eventTables, chairs],
  );
  const stats = useMemo(
    () => seatingStats(chairs, eventAssignments, guests),
    [chairs, eventAssignments, guests],
  );
  const guestById = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest])),
    [guests],
  );
  const assignmentByGuest = useMemo(
    () => new Map(eventAssignments.map((item) => [item.guest_id, item])),
    [eventAssignments],
  );
  const tableById = useMemo(
    () => new Map(eventTables.map((table) => [table.id, table])),
    [eventTables],
  );
  const assignmentByChair = useMemo(() => {
    const result = new Map<string, SeatingAssignment>();
    for (const assignment of eventAssignments) {
      result.set(assignment.table_id, assignment);
      for (const seatId of assignment.seat_ids ?? []) {
        result.set(seatId, assignment);
      }
    }
    return result;
  }, [eventAssignments]);
  const selectedChairIds = useMemo(() => {
    const table = selectedTableId ? tableById.get(selectedTableId) : null;
    if (!table) return [];
    if (table.capacity <= 1) return [table.id];
    return [
      table.id,
      ...chairs
        .filter((chair) => chair.parent_table_id === table.id)
        .map((chair) => chair.id),
    ];
  }, [chairs, selectedTableId, tableById]);
  const selectedAssignments = useMemo(
    () =>
      selectedChairIds.length > 0
        ? eventAssignments.filter(
            (assignment) =>
              selectedChairIds.includes(assignment.table_id) ||
              (assignment.seat_ids ?? []).some((seatId) =>
                selectedChairIds.includes(seatId),
              ),
          )
        : [],
    [eventAssignments, selectedChairIds],
  );
  const selectedGuestIds = useMemo(
    () => new Set(selectedAssignments.map((assignment) => assignment.guest_id)),
    [selectedAssignments],
  );
  const selectedPeople = useMemo(
    () =>
      selectedAssignments.reduce((sum, assignment) => {
        const guest = guestById.get(assignment.guest_id);
        return sum + (guest ? guestPeopleCount(guest) : 0);
      }, 0),
    [selectedAssignments, guestById],
  );
  const selectedSeatCount = useMemo(
    () =>
      selectedAssignments.reduce(
        (sum, assignment) =>
          sum + Math.max(1, assignment.seat_ids?.length ?? 1),
        0,
      ),
    [selectedAssignments],
  );
  const selectedTable = selectedTableId
    ? tableById.get(selectedTableId) ?? null
    : null;
  const selectedGuest = selectedGuestId
    ? guestById.get(selectedGuestId) ?? null
    : null;

  const filteredGuests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const side = guestSideOf(guest);
      if (sideFilter !== "all" && side !== sideFilter) return false;
      if (!needle) return true;
      return [guest.name, guest.guest_group, guest.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [guests, query, sideFilter]);

  const eventLabel = (event: SeatingEvent) =>
    event.event_type === "akad" ? copy.seating.akad : copy.seating.dinner;

  async function assignGuest(
    guestId: string,
    tableId: string,
    allowOverCapacity = false,
  ) {
    if (!selectedEvent || busy) return;
    const table = tableById.get(tableId);
    const guest = guestById.get(guestId);
    if (!table || !guest) return;
    if (table.capacity > 1 && table.kind !== "chair") return;
    if (Number(table.capacity) > 1) return;
    const current = assignmentByGuest.get(guestId);
    if (
      current &&
      (current.table_id === tableId ||
        (current.seat_ids ?? []).includes(tableId)) &&
      (current.seat_ids?.length ?? 0) >= guestPeopleCount(guest)
    ) {
      setSelectedTableId(tableId);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", selectedEvent.id);
      formData.set("tableId", tableId);
      formData.set("guestId", guestId);
      if (allowOverCapacity) formData.set("allowOverCapacity", "1");
      const result = await assignGuestAction(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSelectedTableId(tableId);
      router.refresh();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  function firstFreeChairForTable(tableId: string) {
    const table = tableById.get(tableId);
    if (!table) return null;
    if (table.capacity <= 1) return table;
    return (
      chairs.find(
        (chair) =>
          chair.parent_table_id === tableId && !assignmentByChair.has(chair.id),
      ) ?? null
    );
  }

  async function assignToSelectedTable(guestId: string) {
    if (!selectedTable) return;
    const target = firstFreeChairForTable(selectedTable.id);
    if (!target) {
      setError(copy.seating.tableFull);
      return;
    }
    await assignGuest(guestId, target.id);
  }

  async function handleTableDrop(guestId: string, tableId: string) {
    if (!selectedEvent || busy) return;
    const target = firstFreeChairForTable(tableId);
    if (!target) {
      setError(copy.seating.tableFull);
      return;
    }
    await assignGuest(guestId, target.id);
  }

  async function swapGuests(guestA: string, guestB: string) {
    if (!selectedEvent || busy) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", selectedEvent.id);
      formData.set("guestA", guestA);
      formData.set("guestB", guestB);
      const result = await swapSeatGuestsAction(formData);
      if (result?.error) setError(result.error);
      else router.refresh();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function handleGuestDrop(guestId: string, chairId: string) {
    if (!selectedEvent || busy) return;
    const targetAssignment = assignmentByChair.get(chairId);
    if (targetAssignment && targetAssignment.guest_id !== guestId) {
      const movingGuest = guestById.get(guestId);
      const targetGuest = guestById.get(targetAssignment.guest_id);
      if (!movingGuest || !targetGuest) return;
      if (!assignmentByGuest.has(guestId)) {
        setError(copy.seating.seatTaken);
        return;
      }
      const message = copy.seating.swapConfirm
        .replace("{a}", movingGuest.name)
        .replace("{b}", targetGuest.name);
      if (!window.confirm(message)) return;
      await swapGuests(guestId, targetAssignment.guest_id);
      setSelectedTableId(chairId);
      return;
    }
    await assignGuest(guestId, chairId);
  }

  async function removeGuest(guestId: string) {
    if (!selectedEvent || busy) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", selectedEvent.id);
      formData.set("guestId", guestId);
      const result = await unassignGuestAction(formData);
      if (result?.error) setError(result.error);
      else router.refresh();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  function moveTablePointerDown(
    event: React.PointerEvent<HTMLElement>,
    table: SeatingTable,
  ) {
    event.stopPropagation();
    dragRef.current = {
      id: table.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: table.canvas_x,
      originY: table.canvas_y,
      x: table.canvas_x,
      y: table.canvas_y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveTablePointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const nextX = Math.min(
      100,
      Math.max(
        0,
        drag.originX + ((event.clientX - drag.startX) / rect.width) * 100,
      ),
    );
    const nextY = Math.min(
      100,
      Math.max(
        0,
        drag.originY + ((event.clientY - drag.startY) / rect.height) * 100,
      ),
    );
    drag.x = nextX;
    drag.y = nextY;
    drag.moved =
      drag.moved ||
      Math.abs(nextX - drag.originX) + Math.abs(nextY - drag.originY) > 0.5;
    setPositions((current) => ({
      ...current,
      [drag.id]: { x: nextX, y: nextY },
    }));
  }

  function panPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    panDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function panPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = panDragRef.current;
    if (!drag) return;
    setPan({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  }

  function panPointerUp() {
    panDragRef.current = null;
  }

  function moveTablePointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const formData = new FormData();
    formData.set("id", drag.id);
    formData.set("x", String(drag.x));
    formData.set("y", String(drag.y));
    void moveTableAction(formData);
  }

  function stagePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    stageDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: stagePos.x,
      originY: stagePos.y,
      x: stagePos.x,
      y: stagePos.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function stagePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = stageDragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(
      96,
      Math.max(4, drag.originX + ((event.clientX - drag.startX) / rect.width) * 100),
    );
    const y = Math.min(
      96,
      Math.max(2, drag.originY + ((event.clientY - drag.startY) / rect.height) * 100),
    );
    drag.x = x;
    drag.y = y;
    setStagePos({ x, y });
  }

  function stagePointerUp() {
    const drag = stageDragRef.current;
    stageDragRef.current = null;
    if (!drag || !selectedEvent) return;
    if (Math.abs(drag.x - drag.originX) < 0.1 && Math.abs(drag.y - drag.originY) < 0.1) {
      return;
    }
    const formData = new FormData();
    formData.set("id", selectedEvent.id);
    formData.set("x", String(drag.x));
    formData.set("y", String(drag.y));
    void moveStageAction(formData);
  }

  if (!selectedEvent) return <div />;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => {
          const active = event.id === selectedEvent.id;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setSelectedEventId(event.id);
                setSelectedTableId(null);
                setDetailsOpen(false);
                setStagePos({
                  x: event.stage_x ?? 50,
                  y: event.stage_y ?? 7,
                });
              }}
              className={`rounded-3xl border p-4 text-left transition-colors ${
                active
                  ? "border-petal-300 bg-gradient-to-br from-petal-50 to-blush/40 shadow-sm"
                  : "border-olive-100 bg-white/70 hover:border-petal-200"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
                {eventLabel(event)}
              </p>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {event.name}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {[event.event_date, event.start_time?.slice(0, 5)]
                  .filter(Boolean)
                  .join(" · ") || copy.form.none}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={isCeremony ? copy.seating.totalChairs : copy.seating.totalTables}
          value={String(isCeremony ? stats.totalTables : tableObjects.length)}
        />
        <StatCard
          label={copy.seating.totalSeats}
          value={String(stats.totalSeats)}
        />
        <StatCard
          label={copy.seating.guestsSeated}
          value={String(stats.seatedPeople)}
          tone="champagne"
        />
        <StatCard
          label={copy.seating.remainingSeats}
          value={String(stats.remainingSeats)}
        />
        <StatCard
          label={copy.seating.unassignedGuests}
          value={String(stats.unassignedPeople)}
          tone="neutral"
        />
      </section>

      <EventSettings key={selectedEvent.id} event={selectedEvent} copy={copy} />

      {error ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <p className="text-sm text-rose-800">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="space-y-3 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
              <Users className="size-4 text-petal-400" aria-hidden />
              {copy.seating.guestList}
            </h2>
            <Badge tone="muted">{guests.length}</Badge>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.seating.searchGuests}
              className={`${inputClass} pl-9`}
            />
          </div>
          <select
            value={sideFilter}
            onChange={(event) =>
              setSideFilter(event.target.value as typeof sideFilter)
            }
            aria-label={copy.guests.side}
            className={inputClass}
          >
            <option value="all">{copy.seating.allGuests}</option>
            <option value="bride">{copy.seating.brideGuests}</option>
            <option value="groom">{copy.seating.groomGuests}</option>
          </select>
          <p className="text-xs leading-relaxed text-ink-soft">
            {copy.seating.dragHint}
          </p>

          <div className="space-y-2">
            {filteredGuests.length === 0 ? (
              <p className="rounded-xl border border-dashed border-olive-200 px-3 py-5 text-center text-sm text-ink-soft">
                {copy.seating.noGuests}
              </p>
            ) : (
              filteredGuests.map((guest) => {
                const assignment = assignmentByGuest.get(guest.id);
                const table = assignment
                  ? tableById.get(assignment.table_id)
                  : null;
                const selected = guest.id === selectedGuestId;
                return (
                  <button
                    key={guest.id}
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/guest-id", guest.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() =>
                      setSelectedGuestId(selected ? null : guest.id)
                    }
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-petal-300 bg-petal-50"
                        : "border-olive-100 bg-white hover:border-petal-200"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {guest.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-soft">
                          {[guest.guest_group, guest.phone]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-soft">
                        {guestPeopleCount(guest)}
                      </span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge
                        tone={
                          guestSideOf(guest) === "bride"
                            ? "blush"
                            : guestSideOf(guest) === "groom"
                              ? "baby"
                              : "muted"
                        }
                      >
                        {label("guestSide", guestSideOf(guest), locale)}
                      </Badge>
                      <Badge tone={table ? "success" : "muted"}>
                        {table
                          ? copy.seating.seatedAt.replace("{table}", table.name)
                          : copy.seating.unassigned}
                      </Badge>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
                  <CircleHelp className="size-4 text-petal-400" aria-hidden />
                  {selectedEvent.name}
                </h2>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {copy.seating.legend}: {copy.seating.emptyTable}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.6, value - 0.1))}
                  className="rounded-lg border border-olive-100 bg-white p-2 text-ink-soft hover:bg-olive-50"
                  aria-label={copy.seating.zoomOut}
                >
                  <ZoomOut className="size-4" aria-hidden />
                </button>
                <span className="min-w-10 text-center text-xs text-ink-soft">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}
                  className="rounded-lg border border-olive-100 bg-white p-2 text-ink-soft hover:bg-olive-50"
                  aria-label={copy.seating.zoomIn}
                >
                  <ZoomIn className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="rounded-lg border border-olive-100 bg-white p-2 text-ink-soft hover:bg-olive-50"
                  aria-label={copy.seating.resetView}
                >
                  <RotateCcw className="size-4" aria-hidden />
                </button>
                {!isCeremony ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTableModal({ open: true, editing: null })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-3 py-2 text-sm font-medium text-white hover:bg-olive-700"
                  >
                    <Plus className="size-4" aria-hidden />
                    {copy.seating.addTable}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLayoutOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-3 py-2 text-sm font-medium text-white hover:bg-olive-700"
                  >
                    <Plus className="size-4" aria-hidden />
                    {copy.seating.manageChairs}
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-auto rounded-2xl border border-olive-100 bg-[radial-gradient(circle_at_50%_0%,#fdf7f5,#f8f2e6)] p-4">
              <div
                ref={canvasRef}
                onPointerDown={panPointerDown}
                onPointerMove={panPointerMove}
                onPointerUp={panPointerUp}
                onPointerCancel={panPointerUp}
                className="relative h-[680px] min-w-[820px] touch-none overflow-hidden rounded-xl border border-petal-100/70 bg-white/30"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  title={copy.seating.stage}
                  onPointerDown={stagePointerDown}
                  onPointerMove={stagePointerMove}
                  onPointerUp={stagePointerUp}
                  onPointerCancel={stagePointerUp}
                  className="absolute z-10 w-48 cursor-grab touch-none rounded-2xl border border-petal-200 bg-white/90 px-4 py-2 text-center shadow-sm active:cursor-grabbing"
                  style={{
                    left: `${stagePos.x}%`,
                    top: `${stagePos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-petal-500">
                    {copy.seating.stage}
                  </p>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-olive-200 bg-white/80 px-4 py-1 text-[10px] text-ink-soft">
                  {copy.seating.entrance}
                </div>

                {eventTables.length === 0 ? (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-soft">
                    {copy.seating.noTables}
                  </p>
                ) : null}

                {!isCeremony
                  ? tableObjects.map((table) => (
                      <div
                        key={table.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (selectedGuestId) {
                            void handleTableDrop(selectedGuestId, table.id);
                          } else {
                            setSelectedTableId(table.id);
                            setDetailsOpen(true);
                          }
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const guestId =
                            event.dataTransfer.getData("text/guest-id");
                          if (guestId) void handleTableDrop(guestId, table.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedTableId(table.id);
                            setDetailsOpen(true);
                          }
                        }}
                        className={`absolute z-10 flex cursor-pointer flex-col items-center justify-center border-2 border-olive-200/80 bg-white/60 text-center shadow-sm ${
                          table.shape === "round" ? "rounded-full" : "rounded-xl"
                        }`}
                        style={{
                          left: `${table.canvas_x}%`,
                          top: `${table.canvas_y}%`,
                          width: `${table.width}%`,
                          height: `${table.height}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <span className="max-w-full truncate px-1 text-xs font-semibold text-ink">
                          {table.name}
                        </span>
                        <span className="text-[10px] text-ink-soft">
                          {table.capacity} seats
                        </span>
                      </div>
                    ))
                  : null}

                {chairs.map((chair) => {
                  const assignment = assignmentByChair.get(chair.id);
                  const guest = assignment
                    ? guestById.get(assignment.guest_id)
                    : null;
                  const selected = selectedTableId === chair.id;
                  return (
                    <div
                      key={chair.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (suppressClick.current) {
                          suppressClick.current = false;
                          return;
                        }
                        if (selectedGuestId) {
                          void assignGuest(selectedGuestId, chair.id);
                        } else {
                          setSelectedTableId(chair.id);
                          setDetailsOpen(true);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTableId(chair.id);
                          setDetailsOpen(true);
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const guestId =
                          event.dataTransfer.getData("text/guest-id");
                        if (guestId) void handleGuestDrop(guestId, chair.id);
                      }}
                      title={guest?.name ?? chair.name}
                      className={`absolute z-30 cursor-pointer rounded-t-xl rounded-b-md border-2 p-1 text-center shadow-sm transition-colors ${
                        selected
                          ? "border-olive-600 ring-2 ring-olive-200"
                          : guest
                            ? guestSideOf(guest) === "bride"
                              ? "border-petal-300 bg-petal-100"
                              : guestSideOf(guest) === "groom"
                                ? "border-baby-300 bg-baby-100"
                                : "border-champagne/70 bg-sand-100"
                            : "border-olive-200 bg-white/95"
                      }`}
                      style={{
                        left: `${chair.canvas_x}%`,
                        top: `${chair.canvas_y}%`,
                        width: `${chair.width}%`,
                        height: `${chair.height}%`,
                        transform: `translate(-50%, -50%) rotate(${chair.rotation ?? 0}deg)`,
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Move chair"
                        onPointerDown={(event) =>
                          moveTablePointerDown(event, chair)
                        }
                        onPointerMove={moveTablePointerMove}
                        onPointerUp={moveTablePointerUp}
                        onPointerCancel={moveTablePointerUp}
                        onClick={(event) => event.stopPropagation()}
                        className="absolute -right-1.5 -top-1.5 z-10 cursor-grab touch-none rounded-full border border-olive-200 bg-white p-1 text-ink-soft/70 shadow-sm hover:bg-olive-50 active:cursor-grabbing"
                      >
                        <GripVertical className="size-3.5" aria-hidden />
                      </button>
                      <span className="mt-1 block h-1 w-4/5 rounded-full bg-current opacity-20" />
                      <span
                        draggable={Boolean(guest)}
                        onDragStart={(event) => {
                          if (!guest) return;
                          event.stopPropagation();
                          event.dataTransfer.setData("text/guest-id", guest.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        title={
                          guest
                            ? `${guest.name} · ${copy.seating.guestDragHint}`
                            : chair.name
                        }
                        className={`mt-0.5 block max-w-full truncate px-0.5 text-[8px] font-semibold leading-tight text-ink ${
                          guest ? "cursor-grab active:cursor-grabbing" : ""
                        }`}
                      >
                        {guest ? guest.name : chair.name}
                      </span>
                      {guest && guestPeopleCount(guest) > 1 ? (
                        <span className="block text-[7px] text-ink-soft">
                          +{guestPeopleCount(guest) - 1}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full border border-olive-200 bg-white" />
                {copy.seating.available}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full border border-champagne bg-sand-100" />
                {copy.seating.partial}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full border border-petal-300 bg-petal-100" />
                {copy.seating.full}
              </span>
            </div>
          </Card>

          {selectedTable ? (
            <Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
                    {copy.seating.details}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-semibold text-ink">
                    {selectedTable.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {selectedTable.capacity <= 1
                      ? `${selectedPeople} pax · ${selectedSeatCount} seats`
                      : `${copy.seating.occupancy}: ${selectedPeople} / ${selectedTable.capacity} · ${copy.seating.remaining}: ${Math.max(0, selectedTable.capacity - selectedPeople)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTableModal({ open: true, editing: selectedTable })
                    }
                    className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                  >
                    {copy.form.edit}
                  </button>
                  <DeleteForm
                    action={deleteTableAction}
                    id={selectedTable.id}
                    copy={copy}
                    label={copy.seating.deleteTable}
                    confirmMessage={copy.seating.deleteTableConfirm}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {selectedTable.capacity > 1 ? (
                  <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs text-ink-soft">
                    {copy.seating.tableAssignHint}
                  </p>
                ) : null}
                <select
                  defaultValue=""
                  disabled={busy}
                  onChange={(event) => {
                    const guestId = event.target.value;
                    event.currentTarget.value = "";
                    if (guestId) void assignToSelectedTable(guestId);
                  }}
                  aria-label={copy.seating.addGuest}
                  className={inputClass}
                >
                  <option value="">{copy.seating.addGuest}</option>
                  {guests
                    .filter(
                      (guest) => !selectedGuestIds.has(guest.id),
                    )
                    .map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name} ({guestPeopleCount(guest)} pax)
                      </option>
                    ))}
                </select>

                {selectedAssignments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-olive-200 px-3 py-4 text-sm text-ink-soft">
                    {copy.seating.emptyTable}
                  </p>
                ) : (
                  selectedAssignments.map((assignment) => {
                      const guest = guestById.get(assignment.guest_id);
                      if (!guest) return null;
                      return (
                        <div
                          key={assignment.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-olive-100 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {guest.name}
                            </p>
                            <p className="text-xs text-ink-soft">
                              {guestPeopleCount(guest)} {copy.seating.guestList.toLowerCase()}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void removeGuest(guest.id)}
                            className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
                          >
                            {copy.seating.remove}
                          </button>
                        </div>
                      );
                    })
                )}
              </div>

              {selectedGuest && !selectedGuestIds.has(selectedGuest.id) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void assignToSelectedTable(selectedGuest.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-3 py-2 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
                >
                  <Plus className="size-4" aria-hidden />
                  {copy.seating.addGuest}: {selectedGuest.name}
                </button>
              ) : null}
            </Card>
          ) : (
            <Card className="border-dashed border-olive-200 bg-cream/60">
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <CircleHelp className="size-4" aria-hidden />
                {copy.seating.dragHint}
              </p>
            </Card>
          )}

          <ChairLayoutModal
            open={layoutOpen}
            onClose={() => setLayoutOpen(false)}
            copy={copy}
            eventId={selectedEvent.id}
          />

          <TableFormModal
            key={`${tableModal.editing?.id ?? "new-table"}-${selectedEvent.id}`}
            open={tableModal.open}
            onClose={() => setTableModal({ open: false, editing: null })}
            copy={copy}
            eventId={selectedEvent.id}
            mode={isCeremony ? "chairs" : "tables"}
            defaultY={18 + eventTables.length * 13}
            table={tableModal.editing}
          />

          <FormModal
            open={detailsOpen && Boolean(selectedTable)}
            onClose={() => setDetailsOpen(false)}
            title={selectedTable?.name ?? copy.seating.details}
            wide
          >
            {selectedTable ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-ink-soft">
                    {selectedTable.capacity <= 1
                      ? `${selectedPeople} pax · ${selectedSeatCount} seats`
                      : `${copy.seating.occupancy}: ${selectedPeople} / ${selectedTable.capacity} · ${copy.seating.remaining}: ${Math.max(0, selectedTable.capacity - selectedPeople)}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      setTableModal({ open: true, editing: selectedTable });
                    }}
                    className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-olive-50"
                  >
                    {isCeremony ? copy.seating.editRow : copy.form.edit}
                  </button>
                </div>

                {error ? (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}

                {selectedTable.capacity > 1 ? (
                  <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs text-ink-soft">
                    {copy.seating.tableAssignHint}
                  </p>
                ) : null}

                <select
                  defaultValue=""
                  disabled={busy}
                  onChange={(event) => {
                    const guestId = event.target.value;
                    event.currentTarget.value = "";
                    if (guestId) void assignToSelectedTable(guestId);
                  }}
                  aria-label={copy.seating.addGuest}
                  className={inputClass}
                >
                  <option value="">{copy.seating.addGuest}</option>
                  {guests
                    .filter(
                      (guest) => !selectedGuestIds.has(guest.id),
                    )
                    .map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name} ({guestPeopleCount(guest)} pax)
                      </option>
                    ))}
                </select>

                <div className="space-y-2">
                  {selectedAssignments.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-olive-200 px-3 py-4 text-sm text-ink-soft">
                      {copy.seating.emptyTable}
                    </p>
                  ) : (
                    selectedAssignments.map((assignment) => {
                        const guest = guestById.get(assignment.guest_id);
                        if (!guest) return null;
                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-olive-100 px-3 py-2"
                          >
                            <span className="min-w-0 truncate text-sm text-ink">
                              {guest.name}{" "}
                              <span className="text-xs text-ink-soft">
                                ({guestPeopleCount(guest)} pax)
                              </span>
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removeGuest(guest.id)}
                              className="shrink-0 text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
                            >
                              {copy.seating.remove}
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="border-t border-olive-100 pt-3">
                  <DeleteForm
                    action={deleteTableAction}
                    id={selectedTable.id}
                    copy={copy}
                    label={isCeremony ? copy.seating.chairRows : copy.seating.deleteTable}
                    confirmMessage={copy.seating.deleteTableConfirm}
                  />
                </div>
              </div>
            ) : null}
          </FormModal>
        </div>
      </div>
    </div>
  );
}
