// Results page: route list + map

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NAVBAR_V2_LOGO,
  NAVBAR_V2_ROOT,
  SIDEBAR_NAV,
  SIDEBAR_NAV_ITEM,
  SIDEBAR_NAV_LABEL_ACTIVE,
  SIDEBAR_NAV_LABEL_INACTIVE,
  SIDEBAR_NAV_PILL_ACTIVE,
  SIDEBAR_NAV_PILL_INACTIVE,
  SIDEBAR_ROOT,
} from "../edit/formStyles.v2";
import styles from "../edit/edit.module.css";
import MapComponent from "./components/Map";
import Sidebar from "./components/Sidebar";
import type { PendingPinMove, Route } from "./types";

function readInitialRoutes(): { routes: Route[]; error: string | null } {
  if (typeof window === "undefined") return { routes: [], error: null };

  const stored = sessionStorage.getItem("optimizeResults");
  if (!stored) return { routes: [], error: null };

  try {
    const parsed = JSON.parse(stored) as Route[];
    return { routes: parsed, error: null };
  } catch {
    return {
      routes: [],
      error: "Route data could not be loaded. Please go back and try again.",
    };
  }
}

export default function ResultsPage() {
  const router = useRouter();
  const [{ routes: initialRoutes, error: initialError }] = useState(readInitialRoutes);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [error] = useState<string | null>(initialError);

  useEffect(() => {
    if (initialRoutes.length > 0) {
      sessionStorage.removeItem("optimizeResults"); // consume once after successful parse + state update
    }
  }, [initialRoutes.length]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingPinMove, setPendingPinMove] = useState<PendingPinMove | null>(null);

  const updateStopNote = useCallback((routeId: string, stopId: string, note: string) => {
    setRoutes((prev) =>
      prev.map((route) => {
        if (route.vehicleId !== routeId) return route;
        return {
          ...route,
          stops: route.stops.map((s) => (s.id === stopId ? { ...s, note } : s)),
        };
      })
    );
  }, [setRoutes]);

  const handleRouteDistanceUpdate = useCallback((vehicleId: string, distanceMi: number) => {
    setRoutes((prev) => {
      const next = prev.map((route) =>
        route.vehicleId === vehicleId && route.distanceMi !== distanceMi
          ? { ...route, distanceMi }
          : route
      );
      return next.every((r, i) => r === prev[i]) ? prev : next;
    });
  }, []);

  const handleEditModeChange = useCallback((value: boolean) => {
    setIsEditMode(value);
    if (!value) setPendingPinMove(null);
  }, []);

  const savePendingPinMove = useCallback(() => {
    if (!pendingPinMove) return;
    setRoutes((prev) =>
      prev.map((route) =>
        route.vehicleId !== pendingPinMove.vehicleId
          ? route
          : {
              ...route,
              stops: route.stops.map((s) =>
                s.id !== pendingPinMove.stopId
                  ? s
                  : { ...s, lat: pendingPinMove.lat, lng: pendingPinMove.lng }
              ),
            }
      )
    );
    setPendingPinMove(null);
  }, [pendingPinMove]);

  const handlePendingPinMove = useCallback(
    (vehicleId: string, stopId: string, lat: number, lng: number) => {
      setPendingPinMove({ vehicleId, stopId, lat, lng });
    },
    []
  );

  const cancelPendingPinMove = useCallback(() => setPendingPinMove(null), []);

  return (
    <main className={`h-screen flex flex-col overflow-hidden font-sans-manrope ${styles.root}`}>
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm w-80 space-y-4">
            <p className="text-sm text-zinc-700">{error}</p>
            <a
              href="/edit"
              className="inline-flex w-full items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500"
            >
              Go back to edit
            </a>
          </div>
        </div>
      )} {/* Map container switched to h-screen and added overflow hidden so the page is forced to be exactly one screen tall, whereas before the page was allowed to get taller than browser window leading to a long scroll */}
      <header className={`${NAVBAR_V2_ROOT} shrink-0 border-b border-zinc-200`}>
        <div className="flex items-center gap-3 min-w-0">
          <p className={NAVBAR_V2_LOGO}>
            DELIVERY OPTIMIZER
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pendingPinMove != null && (
            <button
              type="button"
              onClick={cancelPendingPinMove}
              className="h-9 px-6 rounded-[80px] border border-[var(--edit-foreground)] font-medium text-[14px] leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={savePendingPinMove}
            className="h-9 px-6 rounded-[80px] border border-[var(--edit-foreground)] font-medium text-[14px] leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:bg-black/5 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            className="h-9 px-6 rounded-[80px] bg-[var(--edit-teal-500)] font-medium text-[14px] leading-5 text-[var(--edit-foreground)] whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            Export
          </button>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className={`${SIDEBAR_ROOT} border-r border-zinc-200`}>
          <div className={SIDEBAR_NAV}>
            <button
              type="button"
              onClick={() => router.push("/edit")}
              className={SIDEBAR_NAV_ITEM}
            >
              <span className="w-full flex items-center justify-center rounded-[80px] px-[9px] py-[4px] text-[var(--edit-muted)]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4.5 4.5H19.5V19.5H4.5V4.5Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 10V19.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M15 10V19.5" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className={SIDEBAR_NAV_LABEL_INACTIVE}>Manage</span>
            </button>

            <button
              type="button"
              className={SIDEBAR_NAV_ITEM}
              aria-current="page"
            >
              <span className={`${SIDEBAR_NAV_PILL_ACTIVE} text-[var(--edit-foreground)]`}>
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4.35 20.7C4.01667 20.8333 3.70833 20.7958 3.425 20.5875C3.14167 20.3792 3 20.1 3 19.75V5.75C3 5.53333 3.0625 5.34167 3.1875 5.175C3.3125 5.00833 3.48333 4.88333 3.7 4.8L9 3L15 5.1L19.65 3.3C19.9833 3.16667 20.2917 3.20417 20.575 3.4125C20.8583 3.62083 21 3.9 21 4.25V12.675C20.75 12.2917 20.4542 11.9417 20.1125 11.625C19.7708 11.3083 19.4 11.0333 19 10.8V5.7L16 6.85V10C15.65 10 15.3083 10.0292 14.975 10.0875C14.6417 10.1458 14.3167 10.2333 14 10.35V6.85L10 5.45V18.525L4.35 20.7ZM5 18.3L8 17.15V5.45L5 6.45V18.3ZM17.4125 17.5C17.7875 17.1667 17.9833 16.6667 18 16C18.0167 15.4333 17.8292 14.9583 17.4375 14.575C17.0458 14.1917 16.5667 14 16 14C15.4333 14 14.9583 14.1917 14.575 14.575C14.1917 14.9583 14 15.4333 14 16C14 16.5667 14.1917 17.0417 14.575 17.425C14.9583 17.8083 15.4333 18 16 18C16.5667 18 17.0375 17.8333 17.4125 17.5ZM16 20C14.9 20 13.9583 19.6083 13.175 18.825C12.3917 18.0417 12 17.1 12 16C12 14.9 12.3917 13.9583 13.175 13.175C13.9583 12.3917 14.9 12 16 12C17.1 12 18.0417 12.3917 18.825 13.175C19.6083 13.9583 20 14.9 20 16C20 16.3833 19.9542 16.7458 19.8625 17.0875C19.7708 17.4292 19.6333 17.75 19.45 18.05L22 20.6L20.6 22L18.05 19.45C17.75 19.6333 17.4292 19.7708 17.0875 19.8625C16.7458 19.9542 16.3833 20 16 20Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className={SIDEBAR_NAV_LABEL_ACTIVE}>Results</span>
            </button>
          </div>
        </aside>

        <div
          className={`shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? "w-[28rem]" : "w-0"}`}
        >
          <Sidebar
            routes={routes}
            isEditMode={isEditMode}
            onEditModeChange={handleEditModeChange}
            onUpdateStopNote={updateStopNote}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            {isEditMode && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-[80px] bg-[#7BCFC2] px-4 py-2 text-sm font-medium text-[#1C1B1F] shadow-sm">
                You are now in editing mode
              </div>
            )}
            <MapComponent
              routes={routes}
              isEditMode={isEditMode}
              pendingPinMove={pendingPinMove}
              onPendingPinMove={handlePendingPinMove}
              onRouteDistanceUpdate={handleRouteDistanceUpdate}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
