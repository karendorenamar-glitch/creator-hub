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
  getRequiredCheckoutPlan,
  hasPlanFeature,
  isPathAllowedForPlan,
  isNavHrefLocked,
  type PlanFeature,
} from "@/lib/plan-features";
import {
  getAccessLockMessage,
  isFreeTrialPlan,
  type PlanContext,
  UPGRADE_PLAN_MESSAGE,
} from "@/lib/plan";
import { PlanUsageBanner } from "@/components/plan/plan-usage-banner";

type PlanContextValue = PlanContext & {
  openUpgradeModal: (description?: string, checkoutHref?: string) => void;
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
  const [upgradeCheckoutHref, setUpgradeCheckoutHref] = useState("/checkout/growth");

  const isFreePlan =
    isFreeTrialPlan(plan.plan) || plan.isTrialExpired;

  const openUpgradeModal = useCallback((description?: string, checkoutHref?: string) => {
    setUpgradeDescription(description ?? UPGRADE_PLAN_MESSAGE);
    setUpgradeCheckoutHref(checkoutHref ?? "/checkout/growth");
    setUpgradeOpen(true);
  }, []);

  const hasFeature = useCallback(
    (feature: PlanFeature) => hasPlanFeature(plan.plan, feature),
    [plan.plan],
  );

  const isNavLocked = useCallback(
    (href: string) => isNavHrefLocked(plan.plan, href, plan.isAccessLocked),
    [plan.plan, plan.isAccessLocked],
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
    plan.isAccessLocked,
  );

  const routeLockMessage = plan.isAccessLocked
    ? getAccessLockMessage(
        plan.plan,
        plan.isTrialExpired,
        plan.isSubscriptionExpired,
      )
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
        checkoutHref={upgradeCheckoutHref}
      />
    </PlanContext.Provider>
  );
}

export function PlanUsageLimitsBanner() {
  const { isAccessLocked } = usePlan();

  if (isAccessLocked) {
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
        openUpgradeModal(
          FEATURE_UPGRADE_MESSAGES[feature],
          `/checkout/${getRequiredCheckoutPlan(feature)}`,
        );
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
