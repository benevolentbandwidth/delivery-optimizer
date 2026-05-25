"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MODAL_OVERLAY } from "@/app/edit/formStyles";
import editStyles from "@/app/edit/edit.module.css";
import { useFocusTrap } from "@/app/edit/hooks/useFocusTrap";
import { useIsClient } from "../hooks/useIsClient";
import type { Route } from "../types";
import { downloadRoutesAsJsonFiles } from "../utils/downloadRouteJson";
import { routeColorHex } from "../utils/routeColors";

type ExportRoutesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  routes: Route[];
};

export default function ExportRoutesModal({
  isOpen,
  onClose,
  routes,
}: ExportRoutesModalProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <ExportRoutesModalPanel routes={routes} onClose={onClose} />,
    document.body,
  );
}

type ExportRoutesModalPanelProps = {
  routes: Route[];
  onClose: () => void;
};

function ExportRoutesModalPanel({
  routes,
  onClose,
}: ExportRoutesModalPanelProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(routes.map((r) => r.vehicleId)),
  );

  const toggle = useCallback((vehicleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  }, []);

  const selectedCount = routes.filter((r) =>
    selectedIds.has(r.vehicleId),
  ).length;

  const handleExportSelected = useCallback(() => {
    downloadRoutesAsJsonFiles(routes, (route) =>
      selectedIds.has(route.vehicleId),
    );
    onClose();
  }, [routes, selectedIds, onClose]);

  const handleExportAll = useCallback(() => {
    downloadRoutesAsJsonFiles(routes, () => true);
    onClose();
  }, [routes, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  return (
    <div
      className={`${MODAL_OVERLAY} ${editStyles.root} font-sans-manrope`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-routes-title"
        className="relative mx-4 flex max-h-[min(560px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
          <h2
            id="export-routes-title"
            className="whitespace-nowrap text-lg font-semibold text-zinc-800"
          >
            Export Routes
          </h2>
          <p className="mt-1 text-sm font-normal leading-snug text-black">
            Select which routes to export as JSON files
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {routes.length === 0 ? (
            <p className="text-xs text-zinc-500">No routes to export.</p>
          ) : (
            <ul className="space-y-2">
              {routes.map((route, idx) => {
                const checked = selectedIds.has(route.vehicleId);
                const stopCount = route.stops.length;
                const vehicleLabel = route.vehicleType ?? "Vehicle";
                const accent = routeColorHex(idx);
                return (
                  <li key={route.vehicleId}>
                    <label className="flex cursor-pointer items-stretch gap-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors hover:bg-zinc-50">
                      <span className="flex shrink-0 items-center border-r border-zinc-100 bg-zinc-50 px-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(route.vehicleId)}
                          className="h-4 w-4 rounded border-zinc-300 text-[var(--edit-teal-400)] focus:ring-[var(--edit-teal-400)]"
                          aria-label={`Include route ${idx + 1} for ${route.driverName}`}
                        />
                      </span>
                      <span
                        className="w-1 shrink-0"
                        style={{ backgroundColor: accent }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 py-3 pl-3 pr-3">
                        <span className="block text-[15px] font-semibold leading-none text-zinc-900">
                          Route {idx + 1} · {route.driverName}
                        </span>
                        <span className="mt-1 block text-[13px] font-medium leading-none text-zinc-500">
                          {vehicleLabel} · {stopCount} stop
                          {stopCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleExportSelected}
            className="h-9 shrink-0 rounded-md border border-[var(--edit-stone-700)] bg-white px-4 text-[14px] font-semibold leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export ({selectedCount})
          </button>
          <button
            type="button"
            onClick={handleExportAll}
            disabled={routes.length === 0}
            className="h-9 shrink-0 rounded-md bg-[var(--edit-teal-400)] px-4 text-[14px] font-semibold leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:brightness-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export All
          </button>
        </div>
      </div>
    </div>
  );
}
