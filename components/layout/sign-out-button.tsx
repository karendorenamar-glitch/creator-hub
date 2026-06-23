"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  variant?: "sidebar" | "settings";
};

export function SignOutButton({
  className,
  variant = "sidebar",
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={cn(
        variant === "sidebar" &&
          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60",
        variant === "settings" &&
          "inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
