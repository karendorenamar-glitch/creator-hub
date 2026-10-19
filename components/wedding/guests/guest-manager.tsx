"use client";

import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { deleteGuestAction } from "@/app/wedding/(app)/guests/actions";
import { DeleteForm } from "@/components/wedding/delete-form";
import { GuestFormModal } from "@/components/wedding/guests/guest-form-modal";
import { AddButton, inputClass } from "@/components/wedding/form-kit";
import { Badge } from "@/components/wedding/ui";
import type { Guest } from "@/lib/wedding/db-types";
import { label, labelGroups } from "@/lib/wedding/labels";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

const rsvpTone = {
  attending: "success",
  pending: "warning",
  not_attending: "muted",
} as const;

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
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");

  const groups = useMemo(
    () =>
      Array.from(
        new Set(
          guests
            .map((guest) => guest.guest_group?.trim())
            .filter((group): group is string => Boolean(group)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [guests],
  );

  const needle = query.trim().toLowerCase();
  const filtered = guests.filter((guest) => {
    if (needle) {
      const haystack = [guest.name, guest.phone, guest.email, guest.guest_group]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (groupFilter !== "all" && (guest.guest_group ?? "") !== groupFilter) {
      return false;
    }
    if (rsvpFilter !== "all" && guest.rsvp_status !== rsvpFilter) return false;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditing(guest);
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
              {group}
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

      {guests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.guests.noGuests}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-blush-200 bg-blush-50/50 px-4 py-8 text-center text-sm text-ink-soft">
          {copy.guests.emptyFilter}
        </p>
      ) : (
        <ul className="divide-y divide-blush-100 rounded-2xl border border-blush-100 bg-white">
          {filtered.map((guest) => (
            <li
              key={guest.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {guest.name}
                  {guest.plus_ones > 0 ? (
                    <span className="ml-2 text-xs font-normal text-ink-soft">
                      +{guest.plus_ones}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {[guest.guest_group, guest.phone, guest.email]
                    .filter(Boolean)
                    .join(" · ") || "—"}
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
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink"
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        copy={copy}
        guest={editing}
        locale={locale}
      />
    </div>
  );
}
