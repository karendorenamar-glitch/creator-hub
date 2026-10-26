import {
  KUA_TEMPLATE,
  KUA_TEMPLATE_GROUPS,
  kuaChecklistTitle,
} from "../lib/wedding/kua-checklist.ts";
import { checklistProgress } from "../lib/wedding/checklist-progress.ts";

let pass = 0;
let fail = 0;

function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    console.log("   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
  }
}

t("KUA item count", KUA_TEMPLATE.length, 24);
t("KUA unique keys", new Set(KUA_TEMPLATE.map((item) => item.key)).size, 24);
t("KUA group order", KUA_TEMPLATE_GROUPS, [
  "Dokumen dasar calon pengantin",
  "Dokumen wali dan saksi",
  "Dokumen tambahan jika berlaku",
  "Sebelum hari akad",
]);
t(
  "KUA group counts",
  KUA_TEMPLATE_GROUPS.map(
    (group) => KUA_TEMPLATE.filter((item) => item.group === group).length,
  ),
  [8, 4, 7, 5],
);
t("KUA title", kuaChecklistTitle(2026), "Checklist berdasarkan KUA tahun 2026");
t(
  "KUA title uses supplied year",
  kuaChecklistTitle(2030),
  "Checklist berdasarkan KUA tahun 2030",
);
t(
  "KUA conditional wording preserved",
  KUA_TEMPLATE.some((item) => item.title.includes("jika berlaku")) &&
    KUA_TEMPLATE.some((item) => item.title.includes("jika diminta")) &&
    KUA_TEMPLATE.some((item) => item.title.includes("jika diwajibkan")),
  true,
);
t(
  "KUA first item",
  KUA_TEMPLATE[0].title,
  "Fotokopi KTP calon suami",
);
t(
  "KUA last item",
  KUA_TEMPLATE[KUA_TEMPLATE.length - 1].title,
  "Siapkan dokumen asli untuk pemeriksaan petugas",
);

t("progress empty", checklistProgress([]), {
  done: 0,
  total: 0,
  percentage: 0,
});
t(
  "progress none done",
  checklistProgress([{ status: "todo" }, { status: "todo" }]),
  { done: 0, total: 2, percentage: 0 },
);
t(
  "progress partial",
  checklistProgress([
    { status: "done" },
    { status: "todo" },
    { status: "todo" },
    { status: "done" },
  ]),
  { done: 2, total: 4, percentage: 50 },
);
t(
  "progress complete",
  checklistProgress([{ status: "done" }, { status: "done" }]),
  { done: 2, total: 2, percentage: 100 },
);

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
