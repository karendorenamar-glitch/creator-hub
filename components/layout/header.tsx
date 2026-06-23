"use client";

import { Menu } from "lucide-react";
import { useMobileMenu } from "@/components/layout/dashboard-shell";

type HeaderProps = {
  title: string;
  description?: string;
  titleAddon?: React.ReactNode;
  actions?: React.ReactNode;
};

export function Header({ title, description, titleAddon, actions }: HeaderProps) {
  const { openMobileMenu } = useMobileMenu();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white backdrop-blur-md">
      <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={openMobileMenu}
            className="mt-0.5 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              {titleAddon}
            </div>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
