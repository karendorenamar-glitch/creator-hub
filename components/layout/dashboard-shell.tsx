"use client";

import { createContext, useContext, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

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
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileMenuContext.Provider
      value={{ openMobileMenu: () => setMobileOpen(true) }}
    >
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MobileMenuContext.Provider>
  );
}
