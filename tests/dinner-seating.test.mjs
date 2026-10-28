import assert from "node:assert/strict";
import test from "node:test";
import {
  dinnerTableSummaries,
  unassignedDinnerPax,
} from "../lib/wedding/dinner-seating.ts";

const table = (id, capacity, parent = null) => ({
  id,
  wedding_id: "w",
  event_id: "e",
  name: id,
  shape: "round",
  capacity,
  canvas_x: 50,
  canvas_y: 50,
  width: 10,
  height: 10,
  sort_order: 0,
  kind: capacity === 1 ? "chair" : "table",
  side: "none",
  rotation: 0,
  parent_table_id: parent,
  created_at: "",
  updated_at: "",
});

const assignment = (id, tableId, guestId, seatIds = []) => ({
  id,
  wedding_id: "w",
  event_id: "e",
  table_id: tableId,
  guest_id: guestId,
  seat_ids: seatIds,
  created_at: "",
});

const guest = (id, plusOnes = 0) => ({
  id,
  wedding_id: "w",
  name: id,
  guest_group: null,
  phone: null,
  email: null,
  side: "bride",
  plus_ones: plusOnes,
  invited_by: null,
  rsvp_status: "pending",
  notes: null,
  created_at: "",
  updated_at: "",
});

const tables = [
  table("t1", 4),
  table("t1c1", 1, "t1"),
  table("t1c2", 1, "t1"),
  table("t2", 3),
  table("t2c1", 1, "t2"),
];

test("one guest group can be split across two dinner tables", () => {
  const summaries = dinnerTableSummaries(
    tables,
    [assignment("a1", "t1c1", "g1", ["t1c1", "t2c1"])],
    [guest("g1", 1)],
  );
  assert.equal(summaries.find((row) => row.table.id === "t1").occupiedSeats, 1);
  assert.equal(summaries.find((row) => row.table.id === "t2").occupiedSeats, 1);
  assert.equal(summaries.find((row) => row.table.id === "t1").guests[0].paxIndex, 1);
  assert.equal(summaries.find((row) => row.table.id === "t2").guests[0].paxIndex, 2);
});

test("remaining pax stays unassigned when only one seat is stored", () => {
  const units = unassignedDinnerPax(
    [guest("g1", 2)],
    [assignment("a1", "t1c1", "g1", ["t1c1"])],
    tables,
  );
  assert.deepEqual(units.map((unit) => unit.paxIndex), [2, 3]);
  assert.equal(units[0].guest.id, "g1");
});

test("moving one pax releases the old table", () => {
  const before = [assignment("a1", "t1c1", "g1", ["t1c1", "t2c1"])];
  const after = [assignment("a1", "t1c1", "g1", ["t1c1", "t1c2"])];
  const beforeSummary = dinnerTableSummaries(tables, before, [guest("g1", 1)]);
  const afterSummary = dinnerTableSummaries(tables, after, [guest("g1", 1)]);
  assert.equal(beforeSummary.find((row) => row.table.id === "t2").occupiedSeats, 1);
  assert.equal(afterSummary.find((row) => row.table.id === "t2").occupiedSeats, 0);
  assert.equal(afterSummary.find((row) => row.table.id === "t1").occupiedSeats, 2);
});

test("capacity never becomes negative when a table is over capacity", () => {
  const summaries = dinnerTableSummaries(
    tables,
    [assignment("a1", "t2", "big")],
    [guest("big", 4)],
  );
  const second = summaries.find((row) => row.table.id === "t2");
  assert.equal(second.occupiedSeats, 1);
  assert.equal(second.remainingSeats, 2);
});
