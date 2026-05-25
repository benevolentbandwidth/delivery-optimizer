"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RouteCardMenuProps = {
  routeLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Open upward inside bottom sheet so Delete stays visible */
  placement?: "up" | "down";
};

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3.5v8.25M6.75 8.5 10 11.75l3.25-3.25M4.5 14.75h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="6.5"
        y="6.5"
        width="9"
        height="9"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 13.5V5.75A1.25 1.25 0 0 1 5.75 4.5H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5.5 6.5h9M8 6.5V5.25A.75.75 0 0 1 8.75 4.5h2.5a.75.75 0 0 1 .75.75V6.5M7.25 6.5v8.25A1.25 1.25 0 0 0 8.5 16h3a1.25 1.25 0 0 0 1.25-1.25V6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 9v4.25M11.75 9v4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function RouteCardMenu({
  routeLabel,
  isOpen,
  onOpenChange,
  onExport,
  onDuplicate,
  onDelete,
  placement = "down",
}: RouteCardMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const gap = 4;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );
      const top =
        placement === "up" ? rect.top - menuHeight - gap : rect.bottom + gap;
      setMenuPosition({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, placement]);

  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[0]?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      onOpenChange(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }
      const menu = document.getElementById(menuId);
      if (!menu?.contains(e.target as Node)) return;

      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (items.length === 0) return;

      const currentIndex = items.findIndex(
        (el) => el === document.activeElement,
      );
      let nextIndex = currentIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex =
          currentIndex < 0 || currentIndex >= items.length - 1
            ? 0
            : currentIndex + 1;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = items.length - 1;
      } else {
        return;
      }

      items[nextIndex]?.focus();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, menuId, onOpenChange]);

  const setItemRef = (index: number) => (el: HTMLButtonElement | null) => {
    itemRefs.current[index] = el;
  };

  const menuPanel = isOpen ? (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label={`${routeLabel} actions`}
      className={`fixed z-[200] min-w-[11.5rem] overflow-hidden rounded-[8px] border border-[var(--edit-stone-200)] bg-white py-1 shadow-lg ${
        menuPosition ? "" : "invisible pointer-events-none"
      }`}
      style={
        menuPosition
          ? { top: menuPosition.top, left: menuPosition.left }
          : { top: 0, left: 0 }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={setItemRef(0)}
        type="button"
        role="menuitem"
        tabIndex={-1}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50"
        onClick={() => {
          onExport();
          onOpenChange(false);
        }}
      >
        <DownloadIcon className="h-4 w-4 shrink-0" />
        Export Route
      </button>
      <button
        ref={setItemRef(1)}
        type="button"
        role="menuitem"
        tabIndex={-1}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus-visible:bg-zinc-50"
        onClick={() => {
          onDuplicate();
          onOpenChange(false);
        }}
      >
        <DuplicateIcon className="h-4 w-4 shrink-0" />
        Duplicate Route
      </button>
      <div className="my-1 border-t border-zinc-100" role="separator" />
      <button
        ref={setItemRef(2)}
        type="button"
        role="menuitem"
        tabIndex={-1}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:bg-red-50"
        onClick={() => {
          onDelete();
          onOpenChange(false);
        }}
      >
        <TrashIcon className="h-4 w-4 shrink-0 text-red-700" />
        Delete Route
      </button>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!isOpen);
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-[var(--edit-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] ${
          isOpen
            ? "border border-[var(--edit-teal-300)] bg-white"
            : "hover:bg-[var(--edit-stone-100)]"
        }`}
        aria-label={`Options for ${routeLabel}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="4" cy="10" r="1.35" />
          <circle cx="10" cy="10" r="1.35" />
          <circle cx="16" cy="10" r="1.35" />
        </svg>
      </button>

      {typeof document !== "undefined" && menuPanel
        ? createPortal(menuPanel, document.body)
        : null}
    </div>
  );
}
