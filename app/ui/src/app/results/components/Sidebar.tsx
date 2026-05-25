// Sidebar: route cards, expand/collapse stops, edit-mode toggle.

import { useMemo, useState } from "react";
import {
  B2_FOOTER_TAGLINE,
  B2_FOUNDATION_NAME,
  B2_LOGO_MARK,
} from "@/app/constants/b2Branding";
import type { Route } from "../types";
import { routeColorHex } from "../utils/routeColors";
import EditableStopItem from "./EditableStopItem";

type SidebarProps = {
  routes: Route[];
  isEditMode: boolean;
  onEditModeChange: (value: boolean) => void;
  onUpdateStopNote: (routeId: string, stopId: string, note: string) => void;
};

export default function Sidebar({
  routes,
  isEditMode,
  onEditModeChange,
  onUpdateStopNote,
}: SidebarProps) {
  const [expandedRouteIds, setExpandedRouteIds] = useState<Set<string>>(
    () => new Set(),
  );

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

  function formatEstTime(minutes: number | undefined): string {
    if (minutes == null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  }

  return (
    <aside
      className={`w-full h-full flex flex-col overflow-hidden border-r-2 bg-white p-4 ${isEditMode ? "border-amber-500" : "border-zinc-200"}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">
            Optimized Routes
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {routes.length} route{routes.length === 1 ? "" : "s"} with{" "}
            {totalStops} total stop
            {totalStops === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEditModeChange(!isEditMode)}
          className="h-9 shrink-0 rounded-[80px] border border-zinc-900 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          {isEditMode ? "Done" : "Edit"}
        </button>
      </div>
      <div className="mt-3 flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {routes.length === 0 ? (
            <p className="text-sm text-zinc-500">No routes yet</p>
          ) : (
            <ul className="space-y-3 pb-2">
              {routes.map((route, idx) => {
                const isExpanded = expandedRouteIds.has(route.vehicleId);
                const sortedStops = [...route.stops].sort(
                  (a, b) => a.sequence - b.sequence,
                );
                const accent = routeColorHex(idx);

                return (
                  <li
                    key={route.vehicleId}
                    className="rounded-xl border border-zinc-200 border-l-4 bg-zinc-50 shadow-sm overflow-hidden"
                    style={{ borderLeftColor: accent }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(route.vehicleId)}
                      className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-zinc-100/80 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className="mt-0.5 h-8 w-8 shrink-0 rounded-md"
                            style={{ backgroundColor: accent }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <div
                              className="text-sm font-semibold"
                              style={{ color: accent }}
                            >
                              Route {idx + 1}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {route.vehicleType ?? "Vehicle"} {route.vehicleId}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-white px-2 py-1.5 shadow-sm min-w-0 text-center">
                            <div className="text-[9px] uppercase tracking-wide text-zinc-500">
                              STOPS
                            </div>
                            <div className="text-sm font-semibold text-zinc-800">
                              {sortedStops.length}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white px-2 py-1.5 shadow-sm min-w-0 text-center">
                            <div className="text-[9px] uppercase tracking-wide text-zinc-500">
                              DISTANCE
                            </div>
                            <div className="text-sm font-semibold text-zinc-800 tabular-nums">
                              {route.distanceMi != null
                                ? `${route.distanceMi}mi`
                                : "—"}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white px-2 py-1.5 shadow-sm min-w-0 text-center">
                            <div className="text-[9px] uppercase tracking-wide text-zinc-500">
                              EST. TIME
                            </div>
                            <div className="text-sm font-semibold text-zinc-800 tabular-nums">
                              {formatEstTime(route.estimatedTimeMinutes)}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-zinc-600">
                          <span className="font-medium text-zinc-700">
                            Driver:
                          </span>{" "}
                          {route.driverName}
                        </p>
                      </div>

                      <svg
                        className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                          isExpanded ? "rotate-90" : "rotate-0"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24c.3.3.3.77 0 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-200 bg-zinc-100/50 p-3">
                        <ul className="space-y-2">
                          {sortedStops.map((stop) => (
                            <li key={stop.id}>
                              <EditableStopItem
                                stop={stop}
                                accentColor={accent}
                                isEditMode={isEditMode}
                                onSaveNote={(note) =>
                                  onUpdateStopNote(
                                    route.vehicleId,
                                    stop.id,
                                    note,
                                  )
                                }
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="shrink-0 pt-4 text-zinc-700">
          <p className="text-3xl leading-none font-semibold text-[var(--edit-teal-500)]">
            {B2_LOGO_MARK}
          </p>
          <p className="mt-1 text-[12px] leading-5 font-medium text-zinc-800">
            {B2_FOOTER_TAGLINE}
          </p>
          <p className="text-[12px] leading-5 font-medium text-zinc-800">
            {B2_FOUNDATION_NAME}
          </p>
        </div>
      </div>
    </aside>
  );
}
