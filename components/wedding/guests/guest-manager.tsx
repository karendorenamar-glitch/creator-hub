"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Split } from "lucide-react";
import {
  deleteGuestAction,
  splitPlusOnesAction,
} from "@/app/wedding/(app)/guests/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { GuestFormModal } from "@/components/wedding/guests/guest-form-modal";
import {
  AddButton,
  FormAlert,
  inputClass,
} from "@/components/wedding/form-kit";
import { Badge } from "@/components/wedding/ui";
import type { Guest, GuestSide } from "@/lib/wedding/db-types";
import { guestPeopleCount, guestSideOf } from "@/lib/wedding/guest-count";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const rsvpTone = {
  attending: "success",
  pending: "warning",
  not_attending: "muted",
} as const;

const sideTone: Record<GuestSide, "blush" | "baby" | "muted"> = {
  bride: "blush",
  groom: "baby",
  unassigned: "muted",
};

const sideOptions: GuestSide[] = ["bride", "groom", "unassigned"];

export function GuestManager({
  guests,
  copy,
  locale,
}: {
  guests: Guest[];
  copy: ModuleCopy;
  locale: "en" | "id";
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState<"all" | GuestSide>("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [splitState, splitAction, splitPending] = useActionState(
    splitPlusOnesAction,
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (splitState?.success) router.refresh();
  }, [splitState?.success, router]);

  const legacyPlusOnes = guests.filter((guest) => guest.plus_ones > 0).length;

  const groupPeople = useMemo(() => {
    const counts = new Map<string, number>();
    for (const guest of guests) {
      const group = guest.guest_group?.trim();
      if (!group) continue;
      counts.set(group, (counts.get(group) ?? 0) + guestPeopleCount(guest));
    }
    return new Map(
      Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
  }, [guests]);
  const groups = useMemo(() => Array.from(groupPeople.keys()), [groupPeople]);

  function groupPeopleLabel(count: number) {
    return count === 1
      ? copy.guests.onePerson
      : copy.guests.groupPeople.replace("{count}", String(count));
  }

  function sideFilterLabel(side: GuestSide) {
    return side === "bride"
      ? copy.guests.brideGuests
      : side === "groom"
        ? copy.guests.groomGuests
        : copy.guests.unassignedGuests;
  }

  const needle = query.trim().toLowerCase();
  const unassignedCount = guests.filter(
    (guest) => guestSideOf(guest) === "unassigned",
  ).length;
  const filtered = guests.filter((guest) => {
    if (needle) {
      const haystack = [guest.name, guest.phone, guest.guest_group]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (sideFilter !== "all" && guestSideOf(guest) !== sideFilter) {
      return false;
    }
    if (
      groupFilter !== "all" &&
      (guest.guest_group ?? "").trim() !== groupFilter
    ) {
      return false;
    }
    if (rsvpFilter !== "all" && guest.rsvp_status !== rsvpFilter) return false;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setFormVersion((version) => version + 1);
    setModalOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditing(guest);
    setFormVersion((version) => version + 1);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {copy.guests.title}
        </h2>
        <AddButton label={copy.guests.add} onClick={openCreate} />
      </div>

      {legacyPlusOnes > 0 ? (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              {copy.guests.splitPlusOnesHint.replace(
                "{count}",
                String(legacyPlusOnes),
              )}
            </p>
            <form action={splitAction}>
              <button
                type="submit"
                disabled={splitPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Split className="size-3.5" aria-hidden />
                {splitPending
                  ? copy.form.saving
                  : copy.guests.splitPlusOnes}
              </button>
            </form>
          </div>
          <FormAlert error={splitState?.error} success={splitState?.success} />
        </div>
      ) : null}

      {unassignedCount > 0 && sideFilter !== "unassigned" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="text-sm text-amber-900">
            {copy.guests.unassignedPrompt.replace(
              "{count}",
              String(unassignedCount),
            )}
          </p>
          <button
            type="button"
            onClick={() => setSideFilter("unassigned")}
            className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-200"
          >
            {copy.guests.unassignedAction}
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.guests.search}
            aria-label={copy.guests.search}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
          aria-label={copy.guests.group}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.guests.allGroups}</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group} · {groupPeopleLabel(groupPeople.get(group) ?? 0)}
            </option>
          ))}
        </select>
        <select
          value={sideFilter}
          onChange={(event) =>
            setSideFilter(event.target.value as "all" | GuestSide)
          }
          aria-label={copy.guests.side}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.guests.allGuests}</option>
          {sideOptions.map((side) => (
            <option key={side} value={side}>
              {sideFilterLabel(side)}
            </option>
          ))}
        </select>
        <select
          value={rsvpFilter}
          onChange={(event) => setRsvpFilter(event.target.value)}
          aria-label={copy.guests.rsvp}
          className={`${inputClass} w-auto min-w-40`}
        >
          <option value="all">{copy.guests.allRsvp}</option>
          {Object.keys(labelGroups.rsvpStatus).map((value) => (
            <option key={value} value={value}>
              {label("rsvpStatus", value, locale)}
            </option>
          ))}
        </select>
      </div>

      {groupFilter !== "all" ? (
        <p className="rounded-xl border border-olive-100 bg-olive-50/50 px-3 py-2 text-sm text-ink-soft">
          <span className="font-medium text-ink">{groupFilter}</span>
          <span className="mx-1.5">·</span>
          {copy.guests.groupTotal.replace(
            "{count}",
            groupPeopleLabel(groupPeople.get(groupFilter) ?? 0),
          )}
        </p>
      ) : null}

      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.guests.noGuests}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-olive-200 bg-olive-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.guests.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-olive-100 rounded-2xl border border-olive-100 bg-white">
          {filtered.map((guest) => (
            <li
              key={guest.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {guest.name}
                  <span className="ml-2 inline-flex align-middle">
                    <Badge tone={sideTone[guestSideOf(guest)]}>
                      {label("guestSide", guestSideOf(guest), locale)}
                    </Badge>
                  </span>
                  {guest.plus_ones > 0 ? (
                    <span className="ml-2 text-xs font-normal text-ink-soft">
                      +{guest.plus_ones}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {[guest.guest_group, guest.phone]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-rosewood">
                  {guest.plus_ones > 0
                    ? copy.guests.plusOnesInfo
                        .replace("{count}", String(guest.plus_ones))
                        .replace("{total}", String(guestPeopleCount(guest)))
                    : copy.guests.onePerson}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={guest.invitation_status === "sent" ? "neutral" : "muted"}
                >
                  {label("invitationStatus", guest.invitation_status, locale)}
                </Badge>
                <Badge tone={rsvpTone[guest.rsvp_status]}>
                  {label("rsvpStatus", guest.rsvp_status, locale)}
                </Badge>
                <button
                  type="button"
                  onClick={() => openEdit(guest)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-olive-50 hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {copy.form.edit}
                </button>
                <DeleteForm action={deleteGuestAction} id={guest.id} copy={copy} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <GuestFormModal
        key={`${editing?.id ?? "new-guest"}-${formVersion}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        guest={editing}
        locale={locale}
        groups={groups}
      />
    </div>
  );
}
