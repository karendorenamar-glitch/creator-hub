"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  ariaLabel: string;
};

export function ActionMenu({ items, ariaLabel }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) return;

    const menuWidth = 192;
    const padding = 8;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding,
    );

    setPosition({
      top: rect.bottom + 6,
      left,
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }

    updatePosition();
    setOpen(true);
  }

  function handleItemClick(item: ActionMenuItem) {
    if (item.disabled || !item.onClick) return;

    item.onClick();
    setOpen(false);
  }

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{ top: position.top, left: position.left }}
            role="menu"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                  item.disabled
                    ? "cursor-not-allowed text-slate-400"
                    : item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}
