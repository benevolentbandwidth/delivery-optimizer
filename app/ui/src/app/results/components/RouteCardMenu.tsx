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
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 184;
      const menuHeight = 148;
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
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      onOpenChange(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, menuId, onOpenChange]);

  const menuPanel =
    isOpen && menuPosition ? (
      <div
        id={menuId}
        role="menu"
        aria-label={`${routeLabel} actions`}
        className="fixed z-[200] min-w-[11.5rem] overflow-hidden rounded-[8px] border border-[var(--edit-stone-200)] bg-white py-1 shadow-lg"
        style={{ top: menuPosition.top, left: menuPosition.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          onClick={() => {
            onExport();
            onOpenChange(false);
          }}
        >
          <DownloadIcon className="h-4 w-4 shrink-0" />
          Export Route
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          onClick={() => {
            onDuplicate();
            onOpenChange(false);
          }}
        >
          <DownloadIcon className="h-4 w-4 shrink-0" />
          Duplicate Route
        </button>
        <div className="my-1 border-t border-zinc-100" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={() => {
            onDelete();
            onOpenChange(false);
          }}
        >
          <DownloadIcon className="h-4 w-4 shrink-0 text-red-700" />
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
            ? "border border-[#6CCBBE] bg-white"
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
