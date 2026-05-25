"use client";

import { useEffect, useId, useRef } from "react";

type RouteCardMenuProps = {
  routeLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
}: RouteCardMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
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
  }, [isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!isOpen);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
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

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${routeLabel} actions`}
          className="absolute right-0 top-full z-20 mt-1 min-w-[11.5rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
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
      )}
    </div>
  );
}
