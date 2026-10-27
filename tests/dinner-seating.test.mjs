import assert from "node:assert/strict";
import test from "node:test";
import {
  dinnerAssignmentTableId,
  dinnerTableSummaries,
  unassignedDinnerGuests,
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
  table("t1c3", 1, "t1"),
  table("t2", 3),
  table("t2c1", 1, "t2"),
  table("t2c2", 1, "t2"),
  table("t2c3", 1, "t2"),
];

test("child-chair assignment resolves to the parent dinner table", () => {
  const tableById = new Map(tables.map((row) => [row.id, row]));
  const dinnerIds = new Set(["t1", "t2"]);
  const row = assignment("a1", "t1c1", "g1", ["t1c1"]);
  assert.equal(dinnerAssignmentTableId(row, tableById, dinnerIds), "t1");
});

test("legacy table-level assignment resolves to that table", () => {
  const tableById = new Map(tables.map((row) => [row.id, row]));
  const dinnerIds = new Set(["t1", "t2"]);
  assert.equal(
    dinnerAssignmentTableId(
      assignment("a1", "t1", "g1"),
      tableById,
      dinnerIds,
    ),
    "t1",
  );
});

test("group size counts toward table occupancy and remaining seats", () => {
  const summaries = dinnerTableSummaries(
    tables,
    [assignment("a1", "t1c1", "g1", ["t1c1"]), assignment("a2", "t1c2", "g2", ["t1c2"])],
    [guest("g1", 0), guest("g2", 2)],
  );
  const first = summaries.find((row) => row.table.id === "t1");
  assert.equal(first.occupiedSeats, 4);
  assert.equal(first.remainingSeats, 0);
  assert.equal(first.freeChairIds.length, 1);
});

test("moving an assignment changes its table without duplicating the guest", () => {
  const before = [
    assignment("a1", "t1c1", "g1", ["t1c1"]),
    assignment("a2", "t2c1", "g2", ["t2c1"]),
  ];
  const moved = before.map((row) =>
    row.guest_id === "g1"
      ? { ...row, table_id: "t2c2", seat_ids: ["t2c2"] }
      : row,
  );
  const people = [guest("g1"), guest("g2")];
  const beforeSummary = dinnerTableSummaries(tables, before, people);
  const afterSummary = dinnerTableSummaries(tables, moved, people);

  assert.equal(
    beforeSummary.find((row) => row.table.id === "t1").occupiedSeats,
    1,
  );
  assert.equal(
    afterSummary.find((row) => row.table.id === "t1").occupiedSeats,
    0,
  );
  assert.equal(
    afterSummary.find((row) => row.table.id === "t2").occupiedSeats,
    2,
  );
  assert.equal(moved.length, 2);
});

test("unassigned guests exclude guests already seated at any dinner table", () => {
  const people = [guest("g1"), guest("g2"), guest("g3")];
  const unassigned = unassignedDinnerGuests(people, [
    assignment("a1", "t1c1", "g1", ["t1c1"]),
    assignment("a2", "t2", "g2"),
  ]);
  assert.deepEqual(
    unassigned.map((row) => row.id),
    ["g3"],
  );
});

test("capacity never becomes negative when a table is over capacity", () => {
  const summaries = dinnerTableSummaries(
    tables,
    [assignment("a1", "t2", "big")],
    [guest("big", 4)],
  );
  const second = summaries.find((row) => row.table.id === "t2");
  assert.equal(second.occupiedSeats, 5);
  assert.equal(second.remainingSeats, 0);
});
