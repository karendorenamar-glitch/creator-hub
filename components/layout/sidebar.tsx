"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { KeffooLogo } from "@/components/login/kefoo-logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Content Planner", icon: CalendarDays },
  { href: "/payouts", label: "Payouts", icon: Wallet },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const navLinkClassName = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-kefoo-500/15 text-kefoo-300"
      : "text-slate-400 hover:bg-slate-800 hover:text-white",
  );

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <div className="origin-center scale-[0.34]">
            <KeffooLogo />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">KEFOO</p>
          <p className="text-xs text-slate-400">Creator Campaign OS</p>
        </div>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = isNavActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={navLinkClassName(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Link
          href="/settings"
          onClick={onMobileClose}
          className={navLinkClassName(isNavActive(pathname, "/settings"))}
        >
          <Settings className="h-5 w-5 shrink-0" />
          Settings
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70"
            onClick={onMobileClose}
            aria-label="Close overlay"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-950 shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
