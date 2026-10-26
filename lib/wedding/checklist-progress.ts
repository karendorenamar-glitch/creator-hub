export type ChecklistProgress = {
  done: number;
  total: number;
  percentage: number;
};

export function checklistProgress(
  items: Array<{ status: string }>,
): ChecklistProgress {
  const total = items.length;
  const done = items.filter((item) => item.status === "done").length;
  return {
    done,
    total,
    percentage: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}
