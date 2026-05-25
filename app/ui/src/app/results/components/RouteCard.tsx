"use client";

import type { Route } from "../types";
import { routeColorHex } from "../utils/routeColors";
import EditableStopItem from "./EditableStopItem";
import RouteCardMenu from "./RouteCardMenu";

type RouteCardProps = {
  route: Route;
  routeIndex: number;
  isExpanded: boolean;
  isEditMode: boolean;
  isMenuOpen: boolean;
  menuOpensUp?: boolean;
  onToggleExpanded: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onExportRoute: () => void;
  onDuplicateRoute: () => void;
  onDeleteRoute: () => void;
  onUpdateStopNote: (stopId: string, note: string) => void;
};

function formatEstTime(minutes: number | undefined): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

export default function RouteCard({
  route,
  routeIndex,
  isExpanded,
  isEditMode,
  isMenuOpen,
  menuOpensUp = false,
  onToggleExpanded,
  onMenuOpenChange,
  onExportRoute,
  onDuplicateRoute,
  onDeleteRoute,
  onUpdateStopNote,
}: RouteCardProps) {
  const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
  const accent = routeColorHex(routeIndex);

  return (
    <li
      className={`rounded-[24px] border overflow-hidden ${
        isEditMode
          ? "border-[var(--edit-teal-300)] bg-white"
          : "border-[var(--edit-stone-200)] bg-white"
      }`}
    >
      <div className="px-3 py-3">
        <div className="flex items-start gap-2.5">
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
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="5.6" cy="7" r="2.35" fill="white" />
              <circle cx="18.5" cy="16.8" r="2.35" fill="white" />
              <circle cx="5.6" cy="7" r="1.05" fill={accent} />
              <circle cx="18.5" cy="16.8" r="1.05" fill={accent} />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={onToggleExpanded}
                className="min-w-0 flex-1 text-left"
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse route ${routeIndex + 1}, ${route.driverName}`
                    : `Expand route ${routeIndex + 1}, ${route.driverName}`
                }
              >
                <div
                  className="text-[15px] font-semibold leading-none"
                  style={{ color: accent }}
                >
                  Route {routeIndex + 1}
                </div>
                <div className="mt-1 text-[13px] font-medium leading-none text-[var(--edit-text-primary)]">
                  {route.driverName}
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-0.5">
                <RouteCardMenu
                  routeLabel={`Route ${routeIndex + 1}, ${route.driverName}`}
                  isOpen={isMenuOpen}
                  onOpenChange={onMenuOpenChange}
                  onExport={onExportRoute}
                  onDuplicate={onDuplicateRoute}
                  onDelete={onDeleteRoute}
                  placement={menuOpensUp ? "up" : "down"}
                />
                <button
                  type="button"
                  onClick={onToggleExpanded}
                  className="flex shrink-0 items-center justify-center rounded-md p-1 text-zinc-500 hover:bg-[var(--edit-stone-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-300)]"
                  aria-label={
                    isExpanded
                      ? `Collapse route ${routeIndex + 1}`
                      : `Expand route ${routeIndex + 1}`
                  }
                >
                  <svg
                    className={`h-4 w-4 shrink-0 transition-transform ${
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
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleExpanded}
              className="mt-3 w-full text-left"
              aria-expanded={isExpanded}
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--edit-text-secondary)]">
                    Stops
                  </div>
                  <div className="mt-1 text-[15px] font-semibold leading-none text-[var(--edit-text-primary)]">
                    {sortedStops.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--edit-text-secondary)]">
                    Distance
                  </div>
                  <div className="mt-1 text-[15px] font-semibold leading-none text-[var(--edit-text-primary)] tabular-nums">
                    {route.distanceMi != null ? `${route.distanceMi}mi` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--edit-text-secondary)]">
                    Time
                  </div>
                  <div className="mt-1 text-[15px] font-semibold leading-none text-[var(--edit-text-primary)] tabular-nums">
                    {formatEstTime(route.estimatedTimeMinutes)}
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-[12px] text-[var(--edit-text-primary)]">
                <svg
                  className="h-4 w-4 text-[var(--edit-text-secondary)]"
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
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-1">
          <ul className="flex flex-col">
            {sortedStops.map((stop, stopIdx) => {
              const isLastStop = stopIdx === sortedStops.length - 1;
              return (
                <li key={stop.id} className="flex gap-3">
                  <div className="flex w-9 shrink-0 flex-col items-center pt-1">
                    <span
                      className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white shadow-sm"
                      style={{ backgroundColor: accent }}
                    >
                      {stop.sequence}
                    </span>
                    {!isLastStop && (
                      <div
                        className="mt-2 w-0 flex-1 min-h-[20px] border-l-2 border-dotted"
                        style={{ borderColor: accent }}
                        aria-hidden
                      />
                    )}
                  </div>
                  <div
                    className={
                      isLastStop ? "min-w-0 flex-1" : "min-w-0 flex-1 pb-5"
                    }
                  >
                    <EditableStopItem
                      stop={stop}
                      accentColor={accent}
                      isEditMode={isEditMode}
                      onSaveNote={(note) => onUpdateStopNote(stop.id, note)}
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
}
