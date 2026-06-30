export type WorkspaceTutorialUsage = {
  campaigns: number;
  creators: number;
  videos: number;
};

export type WorkspaceTutorialStepId = "campaign" | "content" | "performance";

const DISMISSED_KEY_PREFIX = "kefoo_workspace_tutorial_dismissed_";
const PERFORMANCE_KEY_PREFIX = "kefoo_workspace_tutorial_performance_";

export function isTutorialDismissed(orgId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISSED_KEY_PREFIX}${orgId}`) === "1";
}

export function dismissTutorial(orgId: string): void {
  localStorage.setItem(`${DISMISSED_KEY_PREFIX}${orgId}`, "1");
}

export function markTutorialPerformanceViewed(orgId: string): void {
  localStorage.setItem(`${PERFORMANCE_KEY_PREFIX}${orgId}`, "1");
}

export function hasViewedTutorialPerformance(orgId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${PERFORMANCE_KEY_PREFIX}${orgId}`) === "1";
}

export function getTutorialProgress(
  usage: WorkspaceTutorialUsage,
  performanceViewed: boolean,
) {
  const steps: Array<{ id: WorkspaceTutorialStepId; completed: boolean }> = [
    { id: "campaign", completed: usage.campaigns >= 1 },
    {
      id: "content",
      completed: usage.creators >= 1 || usage.videos >= 1,
    },
    { id: "performance", completed: performanceViewed },
  ];

  const completedCount = steps.filter((step) => step.completed).length;

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    allComplete: completedCount === steps.length,
  };
}
