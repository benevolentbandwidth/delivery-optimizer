// Sidebar: route cards, expand/collapse stops, edit-mode toggle.

import { useMemo, useState } from "react";
import type { Route } from "../types";
import RouteCard from "./RouteCard";

type SidebarProps = {
  routes: Route[];
  isEditMode: boolean;
  onEditModeChange: (value: boolean) => void;
  onUpdateStopNote: (routeId: string, stopId: string, note: string) => void;
  onExportRoute: (vehicleId: string) => void;
  onDuplicateRoute: (vehicleId: string) => void;
  onDeleteRoute: (vehicleId: string) => void;
  /** Desktop sidebar vs mobile bottom-sheet list body */
  variant?: "sidebar" | "sheet";
};

export default function Sidebar({
  routes,
  isEditMode,
  onEditModeChange,
  onUpdateStopNote,
  onExportRoute,
  onDuplicateRoute,
  onDeleteRoute,
  variant = "sidebar",
}: SidebarProps) {
  const isSheet = variant === "sheet";
  const [expandedRouteIds, setExpandedRouteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [openMenuRouteId, setOpenMenuRouteId] = useState<string | null>(null);

  const totalStops = useMemo(
    () => routes.reduce((sum, r) => sum + r.stops.length, 0),
    [routes],
  );

  function toggleExpanded(routeId: string) {
    setExpandedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }

  return (
    <aside
      className={
        isSheet
          ? "w-full flex flex-col"
          : "w-full h-full flex flex-col overflow-hidden border-r-2 border-[var(--edit-stone-200)] bg-white p-4"
      }
    >
      {!isSheet && (
        <div className="flex shrink-0 items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--edit-text-primary)] whitespace-nowrap">
              Optimized Routes
            </h2>
            <p className="mt-1 text-xs text-[var(--edit-text-secondary)]">
              {routes.length} route{routes.length === 1 ? "" : "s"} with{" "}
              {totalStops} total stop
              {totalStops === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEditModeChange(!isEditMode)}
            className={`h-9 shrink-0 rounded-[80px] px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)] ${
              isEditMode
                ? "border border-[#7BCFC2] bg-[#7BCFC2] text-[#1C1B1F] hover:bg-[#6dc5b7]"
                : "border border-[var(--edit-stone-700)] bg-white text-[var(--edit-text-primary)] hover:bg-[var(--edit-stone-50)]"
            }`}
          >
            {isEditMode ? "Save edits" : "Edit"}
          </button>
        </div>
      )}
      <div className={isSheet ? "w-full" : "flex-1 min-h-0 overflow-y-auto"}>
        {routes.length === 0 ? (
          <p className="text-sm text-zinc-500">No routes yet</p>
        ) : (
          <ul className="space-y-3 pb-2">
            {routes.map((route, idx) => (
              <RouteCard
                key={route.vehicleId}
                route={route}
                routeIndex={idx}
                isExpanded={expandedRouteIds.has(route.vehicleId)}
                isEditMode={isEditMode}
                isMenuOpen={openMenuRouteId === route.vehicleId}
                menuOpensUp={isSheet}
                onToggleExpanded={() => toggleExpanded(route.vehicleId)}
                onMenuOpenChange={(open) =>
                  setOpenMenuRouteId(open ? route.vehicleId : null)
                }
                onExportRoute={() => onExportRoute(route.vehicleId)}
                onDuplicateRoute={() => onDuplicateRoute(route.vehicleId)}
                onDeleteRoute={() => {
                  onDeleteRoute(route.vehicleId);
                  setExpandedRouteIds((prev) => {
                    const next = new Set(prev);
                    next.delete(route.vehicleId);
                    return next;
                  });
                  if (openMenuRouteId === route.vehicleId) {
                    setOpenMenuRouteId(null);
                  }
                }}
                onUpdateStopNote={(stopId, note) =>
                  onUpdateStopNote(route.vehicleId, stopId, note)
                }
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
