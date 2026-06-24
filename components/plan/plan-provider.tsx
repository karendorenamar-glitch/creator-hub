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
  FEATURE_UPGRADE_MESSAGES,
  hasPlanFeature,
  isPathAllowedForPlan,
  isNavHrefLocked,
  type PlanFeature,
} from "@/lib/plan-features";
import {
  isFreeTrialPlan,
  FREE_TRIAL_EXPIRED_MESSAGE,
  type PlanContext,
  UPGRADE_PLAN_MESSAGE,
} from "@/lib/plan";
import { PlanUsageBanner } from "@/components/plan/plan-usage-banner";

type PlanContextValue = PlanContext & {
  openUpgradeModal: (description?: string) => void;
  isNavLocked: (href: string) => boolean;
  isFreePlan: boolean;
  hasFeature: (feature: PlanFeature) => boolean;
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

  const isFreePlan =
    isFreeTrialPlan(plan.plan) || plan.isTrialExpired;

  const openUpgradeModal = useCallback((description?: string) => {
    setUpgradeDescription(description ?? UPGRADE_PLAN_MESSAGE);
    setUpgradeOpen(true);
  }, []);

  const hasFeature = useCallback(
    (feature: PlanFeature) => hasPlanFeature(plan.plan, feature),
    [plan.plan],
  );

  const isNavLocked = useCallback(
    (href: string) => isNavHrefLocked(plan.plan, href, plan.isTrialExpired),
    [plan.plan, plan.isTrialExpired],
  );

  const value = useMemo(
    () => ({
      ...plan,
      openUpgradeModal,
      isNavLocked,
      isFreePlan,
      hasFeature,
    }),
    [plan, openUpgradeModal, isNavLocked, isFreePlan, hasFeature],
  );

  const routeLocked = !isPathAllowedForPlan(
    plan.plan,
    pathname,
    plan.isTrialExpired,
  );

  const routeLockMessage = plan.isTrialExpired
    ? FREE_TRIAL_EXPIRED_MESSAGE
    : upgradeDescription;

  function handleCloseUpgrade() {
    setUpgradeOpen(false);

    if (routeLocked) {
      router.push(isFreePlan ? "/campaigns" : "/settings");
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
            onClick={() => openUpgradeModal(routeLockMessage)}
          >
            <span className="rounded-2xl border border-kefoo-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-lg">
              {routeLockMessage}
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

export function PlanUsageLimitsBanner() {
  const { isTrialExpired } = usePlan();

  if (isTrialExpired) {
    return null;
  }

  return <PlanUsageBanner showUpgradeLink />;
}

/** @deprecated Use PlanUsageLimitsBanner */
export function FreeTrialUsageBanner() {
  return <PlanUsageLimitsBanner />;
}

export function useRequirePlanFeature(feature: PlanFeature) {
  const { hasFeature, openUpgradeModal } = usePlan();

  return useCallback(
    (onAllowed: () => void) => {
      if (!hasFeature(feature)) {
        openUpgradeModal(FEATURE_UPGRADE_MESSAGES[feature]);
        return;
      }

      onAllowed();
    },
    [hasFeature, feature, openUpgradeModal],
  );
}

/** @deprecated Use useRequirePlanFeature("bulk_upload") instead. */
export function useUpgradeIfFreePlan() {
  return useRequirePlanFeature("bulk_upload");
}
