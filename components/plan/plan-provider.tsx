"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { UpgradePlanModal } from "@/components/plan/upgrade-plan-modal";
import {
  isPathAllowedOnFreeTrial,
  type PlanContext,
  UPGRADE_PLAN_MESSAGE,
} from "@/lib/plan";

type PlanContextValue = PlanContext & {
  openUpgradeModal: (description?: string) => void;
  isNavLocked: (href: string) => boolean;
  isFreePlan: boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function usePlan() {
  const context = useContext(PlanContext);

  if (!context) {
    throw new Error("usePlan must be used within PlanProvider");
  }

  return context;
}

type PlanProviderProps = {
  plan: PlanContext;
  children: ReactNode;
};

export function PlanProvider({ plan, children }: PlanProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeDescription, setUpgradeDescription] = useState(UPGRADE_PLAN_MESSAGE);

  const isFreePlan = plan.isFreeTrial || plan.isTrialExpired;

  const openUpgradeModal = useCallback((description?: string) => {
    setUpgradeDescription(description ?? UPGRADE_PLAN_MESSAGE);
    setUpgradeOpen(true);
  }, []);

  const isNavLocked = useCallback(
    (href: string) => {
      if (!isFreePlan) {
        return false;
      }

      return !isPathAllowedOnFreeTrial(href);
    },
    [isFreePlan],
  );

  const value = useMemo(
    () => ({
      ...plan,
      openUpgradeModal,
      isNavLocked,
      isFreePlan,
    }),
    [plan, openUpgradeModal, isNavLocked, isFreePlan],
  );

  const routeLocked = isFreePlan && !isPathAllowedOnFreeTrial(pathname);

  function handleCloseUpgrade() {
    setUpgradeOpen(false);

    if (routeLocked) {
      router.push("/campaigns");
    }
  }

  return (
    <PlanContext.Provider value={value}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className={routeLocked ? "pointer-events-none opacity-50" : undefined}>
          {children}
        </div>

        {routeLocked ? (
          <button
            type="button"
            className="absolute inset-0 z-40 flex items-start justify-center bg-white/20 p-6 pt-28"
            onClick={() => openUpgradeModal(UPGRADE_PLAN_MESSAGE)}
          >
            <span className="rounded-2xl border border-kefoo-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-lg">
              {UPGRADE_PLAN_MESSAGE}
            </span>
          </button>
        ) : null}
      </div>

      <UpgradePlanModal
        open={upgradeOpen}
        onClose={handleCloseUpgrade}
        description={upgradeDescription}
      />
    </PlanContext.Provider>
  );
}

export function FreeTrialUsageBanner() {
  const plan = usePlan();

  if (!plan.isFreeTrial || plan.isTrialExpired) {
    return null;
  }

  const { limits, usage } = plan;

  return (
    <div className="mb-6 rounded-2xl border border-kefoo-200 bg-kefoo-50 px-4 py-3 text-sm text-kefoo-900">
      <p className="font-medium">Free trial limits</p>
      <p className="mt-1 text-kefoo-800">
        {usage.campaigns}/{limits.campaigns ?? "∞"} campaigns · {usage.creators}/
        {limits.creators ?? "∞"} creators · {usage.videos}/{limits.videos ?? "∞"}{" "}
        videos
      </p>
    </div>
  );
}

export function useUpgradeIfFreePlan() {
  const { isFreePlan, openUpgradeModal } = usePlan();

  return useCallback(
    (onAllowed: () => void) => {
      if (isFreePlan) {
        openUpgradeModal(UPGRADE_PLAN_MESSAGE);
        return;
      }

      onAllowed();
    },
    [isFreePlan, openUpgradeModal],
  );
}
