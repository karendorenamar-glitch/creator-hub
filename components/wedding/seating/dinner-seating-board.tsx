"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  assignGuestAction,
  generateDinnerLayoutAction,
  renameDinnerTableAction,
  unassignGuestAction,
} from "@/app/wedding/(app)/seating/actions";
import {
  Field,
  FormAlert,
  ModalFooter,
  inputClass,
} from "@/components/wedding/form-kit";
import { FormModal } from "@/components/wedding/form-modal";
import { Badge, Card, StatCard } from "@/components/wedding/ui";
import type {
  Guest,
  SeatingAssignment,
  SeatingEvent,
  SeatingTable,
} from "@/lib/wedding/db-types";
import { guestPeopleCount, guestSideOf } from "@/lib/wedding/guest-count";
import { label } from "@/lib/wedding/labels";
import {
  dinnerTableSummaries,
  unassignedDinnerGuests,
} from "@/lib/wedding/dinner-seating";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

type DinnerSeatingBoardProps = {
  events: SeatingEvent[];
  tables: SeatingTable[];
  assignments: SeatingAssignment[];
  guests: Guest[];
  copy: ModuleCopy;
  locale: "en" | "id";
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
};

function DinnerLayoutModal({
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
    generateDinnerLayoutAction,
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
    <FormModal
      open={open}
      onClose={onClose}
      title={copy.seating.dinnerLayoutTitle}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <FormAlert error={state?.error} success={state?.success} />
        <p className="text-sm leading-relaxed text-ink-soft">
          {copy.seating.dinnerLayoutIntro}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={copy.seating.guestTables}
            htmlFor="dinner-board-table-count"
          >
            <input
              id="dinner-board-table-count"
              name="tableCount"
              type="number"
              min={1}
              max={40}
              required
              defaultValue={8}
              className={inputClass}
            />
          </Field>
          <Field
            label={copy.seating.chairsPerTable}
            htmlFor="dinner-board-chairs"
          >
            <input
              id="dinner-board-chairs"
              name="chairsPerTable"
              type="number"
              min={2}
              max={20}
              required
              defaultValue={8}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="rounded-xl border border-olive-100 bg-olive-50/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {copy.seating.dinnerLayoutHint}
        </p>
        <label className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs leading-relaxed text-rose-800">
          <input
            type="checkbox"
            name="replace"
            value="1"
            className="mt-0.5 size-4 shrink-0 accent-rose-600"
          />
          <span>{copy.seating.replaceLayout}</span>
        </label>
        <ModalFooter
          pending={pending}
          submitLabel={copy.seating.setupDinnerLayout}
          savingLabel={copy.form.saving}
          cancelLabel={copy.form.cancel}
          onCancel={onClose}
        />
      </form>
    </FormModal>
  );
}

function DinnerTableNameModal({
  table,
  eventId,
  onClose,
  copy,
}: {
  table: SeatingTable | null;
  eventId: string;
  onClose: () => void;
  copy: ModuleCopy;
}) {
  const [state, formAction, pending] = useActionState(
    renameDinnerTableAction,
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  if (!table) return null;

  return (
    <FormModal
      open={Boolean(table)}
      onClose={onClose}
      title={copy.form.edit}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={table.id} />
        <input type="hidden" name="eventId" value={eventId} />
        <FormAlert error={state?.error} success={state?.success} />
        <Field label={copy.seating.tableName} htmlFor="dinner-table-name">
          <input
            id="dinner-table-name"
            name="name"
            required
            maxLength={80}
            defaultValue={table.name}
            className={inputClass}
            autoFocus
          />
        </Field>
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


export function DinnerSeatingBoard({
  events,
  tables,
  assignments,
  guests,
  copy,
  locale,
  selectedEventId,
  onSelectEvent,
}: DinnerSeatingBoardProps) {
  const router = useRouter();
  const event =
    events.find(
      (item) => item.id === selectedEventId && item.event_type === "dinner",
    ) ?? events.find((item) => item.event_type === "dinner");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [targetTableId, setTargetTableId] = useState<string | null>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<SeatingTable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupState, setupAction, setupPending] = useActionState(
    generateDinnerLayoutAction,
    null,
  );
  const unassignedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (setupState?.success) router.refresh();
  }, [setupState?.success, router]);

  const eventAssignments = useMemo(
    () =>
      event
        ? assignments.filter((assignment) => assignment.event_id === event.id)
        : [],
    [assignments, event],
  );
  const summaries = useMemo(
    () => dinnerTableSummaries(tables, eventAssignments, guests),
    [tables, eventAssignments, guests],
  );
  const targetSummary = targetTableId
    ? summaries.find((summary) => summary.table.id === targetTableId) ?? null
    : null;
  const unassigned = useMemo(
    () => unassignedDinnerGuests(guests, eventAssignments),
    [guests, eventAssignments],
  );
  const filteredUnassigned = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return unassigned;
    return unassigned.filter((guest) =>
      [guest.name, guest.guest_group, guest.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [unassigned, query]);

  const totalSeats = summaries.reduce(
    (sum, summary) => sum + summary.table.capacity,
    0,
  );
  const seatedPeople = summaries.reduce(
    (sum, summary) => sum + summary.occupiedSeats,
    0,
  );
  const unassignedPeople = unassigned.reduce(
    (sum, guest) => sum + guestPeopleCount(guest),
    0,
  );

  if (!event) return null;
  const eventId = event.id;

  function freeTableOptions(guest: Guest, currentTableId?: string) {
    const needed = guestPeopleCount(guest);
    return summaries.filter(
      (summary) =>
        summary.table.id !== currentTableId &&
        summary.remainingSeats >= needed &&
        summary.freeChairIds.length >= needed,
    );
  }

  async function assignGuestToTable(guestId: string, tableId: string) {
    if (busy) return;
    const summary = summaries.find((item) => item.table.id === tableId);
    const guest = guests.find((item) => item.id === guestId);
    if (!summary || !guest) return;

    const needed = guestPeopleCount(guest);
    if (summary.remainingSeats < needed) {
      setError(copy.seating.notEnoughSeats);
      return;
    }
    if (summary.freeChairIds.length < needed) {
      setError(
        summary.freeChairIds.length === 0
          ? copy.seating.noTableSeats
          : copy.seating.notEnoughSeats,
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
      formData.set("tableId", summary.freeChairIds[0]);
      formData.set("guestId", guestId);
      const result = await assignGuestAction(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setTargetTableId(null);
      router.refresh();
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  async function unassignGuest(guestId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
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

  function toggleTable(tableId: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2">
        {events.map((item) => {
          const active = item.id === event.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectEvent(item.id)}
              className={`rounded-3xl border p-4 text-left transition-colors ${
                active
                  ? "border-petal-300 bg-gradient-to-br from-petal-50 to-blush/40 shadow-sm"
                  : "border-olive-100 bg-white/70 hover:border-petal-200"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">
                {item.event_type === "akad"
                  ? copy.seating.akad
                  : copy.seating.dinner}
              </p>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {item.name}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {[item.event_date, item.start_time?.slice(0, 5)]
                  .filter(Boolean)
                  .join(" · ") || copy.seating.subtitle}
              </p>
            </button>
          );
        })}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-rosewood">
            {copy.seating.dinner}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-ink">
            {event.name}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {copy.seating.dinnerBoardHint}
          </p>
        </div>
        {summaries.length > 0 ? (
          <button
            type="button"
            onClick={() => setLayoutOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            <Users className="size-4" aria-hidden />
            {copy.seating.setupDinnerLayout}
          </button>
        ) : null}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={copy.seating.totalTables}
          value={String(summaries.length)}
          icon={<Users className="size-4" aria-hidden />}
        />
        <StatCard
          label={copy.seating.totalSeats}
          value={String(totalSeats)}
          tone="champagne"
        />
        <StatCard
          label={copy.seating.guestsSeated}
          value={String(seatedPeople)}
          tone="baby"
        />
        <StatCard
          label={copy.seating.unassignedGuests}
          value={String(unassignedPeople)}
          tone="neutral"
        />
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}


      <div ref={unassignedRef}>
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ink">
              {copy.seating.unassignedTitle}
            </h3>
            <p className="text-xs text-ink-soft">
              {unassignedPeople} pax · {unassigned.length}{" "}
              {copy.seating.guestList.toLowerCase()}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
            <input
              value={query}
              onChange={(inputEvent) => setQuery(inputEvent.target.value)}
              placeholder={copy.seating.searchUnassigned}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {targetSummary ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-sage/25 px-3 py-2 text-xs text-cocoa/75">
            <span>
              {copy.seating.assignToTable}:{" "}
              <strong className="font-semibold text-cocoa">
                {targetSummary.table.name}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setTargetTableId(null)}
              className="rounded p-0.5 text-cocoa/50 hover:bg-white/60 hover:text-cocoa"
              aria-label={copy.form.cancel}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}

        {filteredUnassigned.length === 0 ? (
          <p className="rounded-xl border border-dashed border-olive-200 px-3 py-4 text-sm text-ink-soft">
            {unassigned.length === 0
              ? copy.seating.noUnassigned
              : copy.seating.noGuests}
          </p>
        ) : (
          <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredUnassigned.map((guest) => {
              const options = targetSummary
                ? [targetSummary].filter(
                    (summary) =>
                      summary.remainingSeats >= guestPeopleCount(guest) &&
                      summary.freeChairIds.length >= guestPeopleCount(guest),
                  )
                : freeTableOptions(guest);
              return (
                <div
                  key={guest.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-olive-100 bg-white/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {guest.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {[guest.guest_group, guest.phone]
                        .filter(Boolean)
                        .join(" · ") || "—"}{" "}
                      · {guestPeopleCount(guest)} pax
                    </p>
                  </div>
                  <select
                    defaultValue=""
                    disabled={busy || options.length === 0}
                    onChange={(selectEvent) => {
                      const tableId = selectEvent.target.value;
                      selectEvent.currentTarget.value = "";
                      if (tableId) void assignGuestToTable(guest.id, tableId);
                    }}
                    aria-label={`${copy.seating.assignToTable}: ${guest.name}`}
                    className="w-full rounded-lg border border-olive-200 bg-white px-2.5 py-1.5 text-xs sm:w-40"
                  >
                    <option value="">
                      {options.length === 0
                        ? copy.seating.tableFull
                        : copy.seating.chooseTable}
                    </option>
                    {options.map((summary) => (
                      <option key={summary.table.id} value={summary.table.id}>
                        {summary.table.name} · {summary.remainingSeats}{" "}
                        {copy.seating.capacityLeft}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      </div>

      {summaries.length === 0 ? (
        <Card className="space-y-4 border-blush/60 bg-ivory/80">
          <div>
            <h3 className="font-heading text-xl text-cocoa">
              {copy.seating.dinnerLayoutTitle}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {copy.seating.dinnerLayoutIntro}
            </p>
          </div>
          <form action={setupAction} className="space-y-4">
            <input type="hidden" name="eventId" value={eventId} />
            <FormAlert error={setupState?.error} success={setupState?.success} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={copy.seating.guestTables}
                htmlFor="dinner-setup-table-count"
              >
                <input
                  id="dinner-setup-table-count"
                  name="tableCount"
                  type="number"
                  min={1}
                  max={40}
                  required
                  defaultValue={8}
                  className={inputClass}
                />
              </Field>
              <Field
                label={copy.seating.chairsPerTable}
                htmlFor="dinner-setup-chairs"
              >
                <input
                  id="dinner-setup-chairs"
                  name="chairsPerTable"
                  type="number"
                  min={2}
                  max={20}
                  required
                  defaultValue={8}
                  className={inputClass}
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={setupPending}
              className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700 disabled:opacity-60"
            >
              <Users className="size-4" aria-hidden />
              {setupPending ? copy.form.saving : copy.seating.setupDinnerLayout}
            </button>
          </form>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => {
            const expanded = !collapsed.has(summary.table.id);
            const percentage =
              summary.table.capacity > 0
                ? Math.min(
                    100,
                    (summary.occupiedSeats / summary.table.capacity) * 100,
                  )
                : 0;
            const canAdd =
              summary.remainingSeats > 0 &&
              summary.freeChairIds.length > 0 &&
              summary.seatObjectCount > 0;

            return (
              <article
                key={summary.table.id}
                className="flex h-full flex-col rounded-2xl border border-blush/60 bg-ivory/90 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg text-cocoa">
                      {summary.table.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditingTable(summary.table)}
                      aria-label={`${copy.form.edit}: ${summary.table.name}`}
                      className="rounded-lg p-1.5 text-cocoa/45 hover:bg-blush/40 hover:text-cocoa"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTable(summary.table.id)}
                      aria-label={expanded ? copy.form.collapse : copy.form.expand}
                      className="rounded-lg p-1.5 text-cocoa/50 hover:bg-blush/40 hover:text-cocoa"
                    >
                      {expanded ? (
                        <ChevronUp className="size-4" aria-hidden />
                      ) : (
                        <ChevronDown className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-cocoa">
                    {summary.occupiedSeats}
                    <span className="text-xs font-normal text-cocoa/45">
                      {" "}/ {summary.table.capacity} {copy.seating.capacityLeft}
                    </span>
                  </p>
                  <p className="text-[10px] text-cocoa/45">
                    {summary.remainingSeats} {copy.seating.capacityLeft}
                  </p>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-blush/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sage to-dusty transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!canAdd || busy}
                    onClick={() => {
                      setTargetTableId(summary.table.id);
                      unassignedRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-sage/30 px-2.5 py-1.5 text-[11px] font-medium text-cocoa transition-colors hover:bg-sage/50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    {copy.seating.addGuest}
                  </button>
                  <span className="text-[10px] text-cocoa/45">
                    {summary.guests.length} {copy.seating.guestList.toLowerCase()}
                  </span>
                </div>

                {summary.seatObjectCount === 0 ? (
                  <p className="mt-2 text-[10px] leading-snug text-cocoa/45">
                    {copy.seating.noTableSeats}
                  </p>
                ) : null}



                {expanded ? (
                  <div className="mt-3 space-y-2 border-t border-blush/60 pt-3">
                    {summary.guests.length === 0 ? (
                      <p className="text-xs text-ink-soft">
                        {copy.seating.emptyTable}
                      </p>
                    ) : (
                      summary.guests.map(({ assignment, guest }) => {
                        const moveOptions = freeTableOptions(
                          guest,
                          summary.table.id,
                        );
                        return (
                          <div
                            key={assignment.id}
                            className="rounded-xl border border-olive-100 bg-white/80 px-3 py-2.5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink">
                                  {guest.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink-soft">
                                  {[guest.guest_group, guest.phone]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}{" "}
                                  · {guestPeopleCount(guest)} pax
                                </p>
                              </div>
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
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <select
                                defaultValue=""
                                disabled={busy || moveOptions.length === 0}
                                onChange={(selectEvent) => {
                                  const tableId = selectEvent.target.value;
                                  selectEvent.currentTarget.value = "";
                                  if (tableId) {
                                    void assignGuestToTable(guest.id, tableId);
                                  }
                                }}
                                aria-label={`${copy.seating.moveTo}: ${guest.name}`}
                                className="min-w-0 flex-1 rounded-lg border border-olive-200 bg-white px-2 py-1.5 text-[11px]"
                              >
                                <option value="">
                                  {moveOptions.length === 0
                                    ? copy.seating.tableFull
                                    : copy.seating.moveTo}
                                </option>
                                {moveOptions.map((option) => (
                                  <option
                                    key={option.table.id}
                                    value={option.table.id}
                                  >
                                    {option.table.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void unassignGuest(guest.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              >
                                <X className="size-3" aria-hidden />
                                {copy.seating.remove}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      <DinnerLayoutModal
        open={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        copy={copy}
        eventId={eventId}
      />

      <DinnerTableNameModal
        table={editingTable}
        eventId={eventId}
        copy={copy}
        onClose={() => setEditingTable(null)}
      />
    </div>
  );
}

