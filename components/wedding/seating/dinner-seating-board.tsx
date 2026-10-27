"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Search, Users, X } from "lucide-react";
import {
  assignGuestAction,
  generateDinnerLayoutAction,
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
  type DinnerTableSummary,
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
  const [addingTableId, setAddingTableId] = useState<string | null>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setAddingTableId(null);
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

  function tableAvailableToGuest(
    guest: Guest,
    summary: DinnerTableSummary,
  ) {
    return (
      summary.remainingSeats >= guestPeopleCount(guest) &&
      summary.freeChairIds.length >= guestPeopleCount(guest)
    );
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
        <button
          type="button"
          onClick={() => setLayoutOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
        >
          <Users className="size-4" aria-hidden />
          {copy.seating.setupDinnerLayout}
        </button>
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


      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-xl font-semibold text-ink">
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

        {filteredUnassigned.length === 0 ? (
          <p className="rounded-xl border border-dashed border-olive-200 px-3 py-4 text-sm text-ink-soft">
            {unassigned.length === 0
              ? copy.seating.noUnassigned
              : copy.seating.noGuests}
          </p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {filteredUnassigned.map((guest) => {
              const options = freeTableOptions(guest);
              return (
                <div
                  key={guest.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-olive-100 bg-white/80 px-3 py-2.5"
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
                    className="w-full rounded-xl border border-olive-200 bg-white px-2.5 py-2 text-xs sm:w-44"
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


      {summaries.length === 0 ? (
        <Card className="space-y-3 border-dashed border-olive-200 bg-ivory/70">
          <p className="text-sm text-ink-soft">{copy.seating.noTables}</p>
          <button
            type="button"
            onClick={() => setLayoutOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-olive-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-olive-700"
          >
            <Users className="size-4" aria-hidden />
            {copy.seating.setupDinnerLayout}
          </button>
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
            const canAdd = summary.remainingSeats > 0;
            const availableGuests = unassigned.filter((guest) =>
              tableAvailableToGuest(guest, summary),
            );
            const hasSeats = summary.freeChairIds.length > 0;

            return (
              <article
                key={summary.table.id}
                className="flex h-full flex-col rounded-2xl border border-blush/70 bg-ivory/90 p-4 shadow-[0_18px_40px_-38px_rgba(87,66,63,0.55)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cocoa/45">
                      {copy.seating.dinner}
                    </p>
                    <h3 className="mt-1 truncate font-heading text-xl text-cocoa">
                      {summary.table.name}
                    </h3>
                  </div>
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

                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="font-heading text-2xl text-cocoa">
                    {summary.occupiedSeats}
                    <span className="text-sm text-cocoa/45">
                      {" "}/ {summary.table.capacity}
                    </span>
                  </p>
                  <p className="text-[11px] text-cocoa/50">
                    {summary.remainingSeats} {copy.seating.capacityLeft}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blush/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sage to-dusty transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!canAdd || !hasSeats || busy}
                    onClick={() =>
                      setAddingTableId((current) =>
                        current === summary.table.id ? null : summary.table.id,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sage/35 px-2.5 py-1.5 text-xs font-medium text-cocoa transition-colors hover:bg-sage/55 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    {copy.seating.addGuest}
                  </button>
                  <span className="text-[11px] text-cocoa/45">
                    {summary.guests.length} {copy.seating.guestList.toLowerCase()}
                  </span>
                </div>

                {!hasSeats ? (
                  <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-800">
                    {copy.seating.noTableSeats}
                  </p>
                ) : null}



                {addingTableId === summary.table.id ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-olive-100 bg-white/75 p-3">
                    {availableGuests.length === 0 ? (
                      <p className="text-xs text-ink-soft">
                        {copy.seating.noUnassigned}
                      </p>
                    ) : (
                      <select
                        defaultValue=""
                        disabled={busy}
                        onChange={(selectEvent) => {
                          const guestId = selectEvent.target.value;
                          selectEvent.currentTarget.value = "";
                          if (guestId) {
                            void assignGuestToTable(guestId, summary.table.id);
                          }
                        }}
                        aria-label={`${copy.seating.addGuest}: ${summary.table.name}`}
                        className="w-full rounded-xl border border-olive-200 bg-white px-2.5 py-2 text-xs"
                      >
                        <option value="">{copy.seating.chooseGuest}</option>
                        {availableGuests.map((guest) => (
                          <option key={guest.id} value={guest.id}>
                            {guest.name} · {guestPeopleCount(guest)} pax
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
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
    </div>
  );
}

