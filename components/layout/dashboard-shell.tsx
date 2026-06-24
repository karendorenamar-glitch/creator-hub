"use client";

import { createContext, useContext, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { PlanProvider } from "@/components/plan/plan-provider";
import { TrialStatusBanner } from "@/components/plan/trial-status-banner";
import type { PlanContext } from "@/lib/plan";
import type { AppLocale } from "@/lib/i18n/types";

export type DashboardUser = {
  email: string;
  displayName: string;
};

type MobileMenuContextValue = {
  openMobileMenu: () => void;
};

type DashboardUserContextValue = DashboardUser | null;

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);
const DashboardUserContext = createContext<DashboardUserContextValue>(null);

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within DashboardShell");
  }
  return context;
}

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}

type DashboardShellProps = {
  children: React.ReactNode;
  plan: PlanContext;
  user: DashboardUser | null;
  locale: AppLocale;
};

export function DashboardShell({
  children,
  plan,
  user,
  locale,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <LanguageProvider initialLocale={locale}>
      <PlanProvider plan={plan}>
        <DashboardUserContext.Provider value={user}>
          <MobileMenuContext.Provider
            value={{ openMobileMenu: () => setMobileOpen(true) }}
          >
            <div className="flex min-h-screen bg-white">
              <Sidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <TrialStatusBanner />
                {children}
              </div>
            </div>
          </MobileMenuContext.Provider>
        </DashboardUserContext.Provider>
      </PlanProvider>
    </LanguageProvider>
  );
}
