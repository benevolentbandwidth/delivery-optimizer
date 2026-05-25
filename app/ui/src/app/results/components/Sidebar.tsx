// Sidebar: route cards, expand/collapse stops, edit-mode toggle.

import Image from "next/image";
import { useMemo, useState } from "react";
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
    <aside className="w-full h-full flex flex-col overflow-hidden border-r-2 border-zinc-200 bg-white p-4">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 whitespace-nowrap">
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
          className={`h-9 shrink-0 rounded-[80px] px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 ${
            isEditMode
              ? "border border-[#7BCFC2] bg-[#7BCFC2] text-[#1C1B1F] hover:bg-[#6dc5b7]"
              : "border border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          {isEditMode ? "Save edits" : "Edit"}
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
                    className={`rounded-[24px] border overflow-hidden ${
                      isEditMode
                        ? "border-[#6CCBBE] bg-white"
                        : "border-zinc-300 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(route.vehicleId)}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span
                              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px]"
                              style={{ backgroundColor: accent }}
                              aria-hidden
                            >
                              <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M5.6 7V15.1C5.6 17 7.15 18.55 9.05 18.55C10.95 18.55 12.5 17 12.5 15.1V9.6C12.5 7.95 13.85 6.6 15.5 6.6C17.15 6.6 18.5 7.95 18.5 9.6V16.8"
                                  stroke="white"
                                  strokeWidth="2.0"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx="5.6" cy="7" r="2.35" fill="white" />
                                <circle
                                  cx="18.5"
                                  cy="16.8"
                                  r="2.35"
                                  fill="white"
                                />
                                <circle
                                  cx="5.6"
                                  cy="7"
                                  r="1.05"
                                  fill={accent}
                                />
                                <circle
                                  cx="18.5"
                                  cy="16.8"
                                  r="1.05"
                                  fill={accent}
                                />
                              </svg>
                            </span>
                            <div className="min-w-0 pt-2.5">
                              <div
                                className="text-[15px] font-semibold leading-none"
                                style={{ color: accent }}
                              >
                                Route {idx + 1}
                              </div>
                              <div className="mt-1 text-[13px] font-medium leading-none text-zinc-900">
                                {route.driverName}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                                STOPS
                              </div>
                              <div className="mt-1 text-[15px] font-semibold leading-none text-zinc-900">
                                {sortedStops.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                                DISTANCE
                              </div>
                              <div className="mt-1 text-[15px] font-semibold leading-none text-zinc-900 tabular-nums">
                                {route.distanceMi != null
                                  ? `${route.distanceMi}mi`
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                                TIME
                              </div>
                              <div className="mt-1 text-[15px] font-semibold leading-none text-zinc-900 tabular-nums">
                                {formatEstTime(route.estimatedTimeMinutes)}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 flex items-center gap-2 text-[12px] text-zinc-700">
                            <svg
                              className="h-4 w-4 text-zinc-400"
                              viewBox="0 0 20 20"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M2.5 5.5A1.5 1.5 0 0 1 4 4h7.5A1.5 1.5 0 0 1 13 5.5V7h1.75c.4 0 .77.16 1.06.44l1.75 1.75c.28.28.44.66.44 1.06v2A1.75 1.75 0 0 1 16.25 14h-.6a2.15 2.15 0 0 1-4.2 0h-3.9a2.15 2.15 0 0 1-4.2 0H2.75A1.75 1.75 0 0 1 1 12.25V7.25A1.75 1.75 0 0 1 2.75 5.5h-.25Z"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="5.4"
                                cy="14"
                                r="1.15"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              />
                              <circle
                                cx="13.6"
                                cy="14"
                                r="1.15"
                                stroke="currentColor"
                                strokeWidth="1.4"
                              />
                            </svg>
                            <span>{route.vehicleType ?? "Vehicle"}</span>
                          </p>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-zinc-400">
                          <span className="text-[20px] leading-none">…</span>
                          <svg
                            className={`h-[22px] w-[22px] shrink-0 transition-transform ${
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
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-1">
                        <ul className="flex flex-col">
                          {sortedStops.map((stop, stopIdx) => {
                            const isLastStop =
                              stopIdx === sortedStops.length - 1;
                            return (
                              <li
                                key={stop.id}
                                className="flex gap-3 items-stretch"
                              >
                                <div className="flex w-9 shrink-0 flex-col items-center pt-1">
                                  <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-[13px] font-semibold text-white shadow-sm">
                                    {stop.sequence}
                                  </span>
                                  {!isLastStop && (
                                    <div
                                      className="mt-2 w-0 flex-1 min-h-[20px] border-l-2 border-dotted border-cyan-500"
                                      aria-hidden
                                    />
                                  )}
                                </div>
                                <div
                                  className={
                                    isLastStop
                                      ? "min-w-0 flex-1"
                                      : "min-w-0 flex-1 pb-5"
                                  }
                                >
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
                                </div>
                              </li>
                            );
                          })}
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
          <Image
            src="/b2-logo.png"
            alt="B2 logo"
            width={72}
            height={24}
            className="h-6 w-auto object-contain"
          />
          <p className="mt-1 text-[12px] leading-5 font-medium text-zinc-800">
            Built with ❤️ for Humanity.
          </p>
          <p className="text-[12px] leading-5 font-medium text-zinc-800">
            The Benevolent Bandwidth Foundation
          </p>
        </div>
      </div>
    </aside>
  );
}
