"use client";

import { createContext, useContext, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PlanProvider } from "@/components/plan/plan-provider";
import { TrialStatusBanner } from "@/components/plan/trial-status-banner";
import type { PlanContext } from "@/lib/plan";

type MobileMenuContextValue = {
  openMobileMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within DashboardShell");
  }
  return context;
}

type DashboardShellProps = {
  children: React.ReactNode;
  plan: PlanContext;
};

export function DashboardShell({ children, plan }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PlanProvider plan={plan}>
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
    </PlanProvider>
  );
}
