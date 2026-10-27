import {
  guestPeopleCount,
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

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
