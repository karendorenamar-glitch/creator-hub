import {
  guestPeopleCount,
  guestSideOf,
  summarizeGuestSides,
  totalGuestPeople,
} from "../lib/wedding/guest-count.ts";

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

t("guest without companion", guestPeopleCount({ plus_ones: 0 }), 1);
t("guest with one companion", guestPeopleCount({ plus_ones: 1 }), 2);
t("guest with three companions", guestPeopleCount({ plus_ones: 3 }), 4);
t("null companion", guestPeopleCount({ plus_ones: null }), 1);
t("undefined companion", guestPeopleCount({}), 1);
t("negative companion is clamped", guestPeopleCount({ plus_ones: -2 }), 1);
t("fractional companion is floored", guestPeopleCount({ plus_ones: 2.9 }), 3);
t("excessive companion is capped", guestPeopleCount({ plus_ones: 99 }), 21);

t(
  "total invited people",
  totalGuestPeople([
    { plus_ones: 0 },
    { plus_ones: 1 },
    { plus_ones: 2 },
  ]),
  6,
);

t("missing side is unassigned", guestSideOf({}), "unassigned");
t("unknown side is unassigned", guestSideOf({ side: "other" }), "unassigned");
t("bride side is kept", guestSideOf({ side: "bride" }), "bride");
t("groom side is kept", guestSideOf({ side: "groom" }), "groom");

const sideSummary = summarizeGuestSides([
  { side: "bride", plus_ones: 1 },
  { side: "bride", plus_ones: 0 },
  { side: "groom", plus_ones: 2 },
  { side: "unassigned", plus_ones: 0 },
  {},
]);

t("bride records", sideSummary.bride.records, 2);
t("bride people", sideSummary.bride.people, 3);
t("groom records", sideSummary.groom.records, 1);
t("groom people", sideSummary.groom.people, 3);
t("unassigned records", sideSummary.unassigned.records, 2);
t("unassigned people", sideSummary.unassigned.people, 2);
t("assigned records exclude unassigned", sideSummary.assigned.records, 3);
t("assigned people exclude unassigned", sideSummary.assigned.people, 6);

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
