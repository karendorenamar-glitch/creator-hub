"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Lock,
  Megaphone,
  Settings,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { KeffooLogo } from "@/components/login/kefoo-logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { usePlan } from "@/components/plan/plan-provider";
import { CONTENT_PLANNER_ENABLED } from "@/lib/features";
import { FEATURE_UPGRADE_MESSAGES } from "@/lib/plan-features";
import { UPGRADE_PLAN_MESSAGE } from "@/lib/plan";
import { cn } from "@/lib/utils";

function getNavUpgradeMessage(href: string) {
  if (href === "/dashboard") {
    return FEATURE_UPGRADE_MESSAGES.dashboard;
  }

  if (href === "/payouts") {
    return FEATURE_UPGRADE_MESSAGES.payouts;
  }

  if (href === "/planner") {
    return FEATURE_UPGRADE_MESSAGES.content_planner;
  }

  return UPGRADE_PLAN_MESSAGE;
}

const navItems = [
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...(CONTENT_PLANNER_ENABLED
    ? [{ href: "/planner", label: "Content Planner", icon: CalendarDays }]
    : []),
  { href: "/payouts", label: "Payouts", icon: Wallet },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const navLinkClassName = (active: boolean, locked: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
    locked
      ? "cursor-not-allowed text-slate-400 hover:bg-slate-50"
      : active
        ? "border border-slate-200 bg-white text-kefoo-600 shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  );

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  locked,
  onLockedClick,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Users;
  active: boolean;
  locked: boolean;
  onLockedClick: () => void;
  onNavigate?: () => void;
}) {
  const className = navLinkClassName(active, locked);

  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        className={className}
      >
        <Icon className="h-5 w-5 shrink-0 opacity-70" />
        <span className="flex-1 text-left">{label}</span>
        <Lock className="h-4 w-4 shrink-0 opacity-60" />
      </button>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { isNavLocked, openUpgradeModal } = usePlan();

  const content = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div className="origin-center scale-[0.34]">
            <KeffooLogo />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">KEFOO</p>
          <p className="text-xs text-slate-500">Creator Campaign OS</p>
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon }) => {
          const locked = isNavLocked(href);

          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isNavActive(pathname, href)}
              locked={locked}
              onLockedClick={() =>
                openUpgradeModal(getNavUpgradeMessage(href))
              }
              onNavigate={onMobileClose}
            />
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-4">
        <SidebarNavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={isNavActive(pathname, "/settings")}
          locked={false}
          onLockedClick={() => undefined}
          onNavigate={onMobileClose}
        />
        <SignOutButton />
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            onClick={onMobileClose}
            aria-label="Close overlay"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
