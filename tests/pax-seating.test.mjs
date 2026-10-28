import {
  buildPaxAllocations,
  nextPaxIndex,
  tablePaxCount,
  unassignedPaxUnits,
  paxUnits,
} from "../lib/wedding/pax-seating.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) pass += 1;
  else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

const guest = (id, plus = 0) => ({
  id,
  wedding_id: "w1",
  name: id,
  phone: null,
  email: null,
  guest_group: null,
  side: "bride",
  invitation_status: "not_sent",
  rsvp_status: "pending",
  plus_ones: plus,
  notes: null,
  created_at: "",
  updated_at: "",
});

const assignment = (id, guestId, tableId, seatIds = []) => ({
  id,
  wedding_id: "w1",
  event_id: "e1",
  table_id: tableId,
  guest_id: guestId,
  seat_ids: seatIds,
  created_at: "",
});

const table = (id, parent = null, capacity = 1) => ({
  id,
  wedding_id: "w1",
  event_id: "e1",
  name: id,
  shape: "round",
  capacity,
  canvas_x: 0,
  canvas_y: 0,
  width: 10,
  height: 10,
  sort_order: 0,
  kind: capacity > 1 ? "table" : "chair",
  side: "none",
  rotation: 0,
  parent_table_id: parent,
  created_at: "",
  updated_at: "",
});

const akadTables = [table("chair-03"), table("chair-12")];
const akadAllocations = buildPaxAllocations(
  [assignment("a1", "g1", "chair-03", ["chair-03", "chair-12"])],
  [guest("g1", 1)],
  akadTables,
  "akad",
);
t("akad allocates one pax per chair", akadAllocations.map((a) => [a.paxIndex, a.targetId]), [
  [1, "chair-03"],
  [2, "chair-12"],
]);
t("same guest remains one record", new Set(akadAllocations.map((a) => a.guest.id)).size, 1);
t("akad unassigned is empty", unassignedPaxUnits([guest("g1", 1)], akadAllocations), []);
t("table pax count", tablePaxCount("chair-12", akadAllocations), 1);

const dinnerTables = [table("m1", null, 8), table("m4", null, 8), table("c1", "m1"), table("c2", "m4")];
const dinnerAllocations = buildPaxAllocations(
  [assignment("a2", "g2", "c1", ["c1", "c2"])],
  [guest("g2", 1)],
  dinnerTables,
  "dinner",
);
t("dinner normalizes child seats to tables", dinnerAllocations.map((a) => a.targetId), ["m1", "m4"]);
t("dinner table one has one pax", tablePaxCount("m1", dinnerAllocations), 1);
t("dinner table four has one pax", tablePaxCount("m4", dinnerAllocations), 1);

const oneAllocated = [akadAllocations[0]];
t("next pax after first", nextPaxIndex(guest("g1", 1), oneAllocated), 2);
t("next pax when full", nextPaxIndex(guest("g1", 1), akadAllocations), null);
t("unassigned pax unit", unassignedPaxUnits([guest("g1", 1)], oneAllocated).map((u) => u.paxIndex), [2]);
t("pax units keep one guest", paxUnits([guest("g1", 1)], akadAllocations).map((u) => u.paxIndex), [1, 2]);

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
