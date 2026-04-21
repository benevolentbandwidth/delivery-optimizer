// Results page: route list + map

"use client";

import { useCallback, useState } from "react";
import MapComponent from "./components/Map";
import Sidebar from "./components/Sidebar";
import { mockRouteToRoute } from "./data/mockRouteLoader";
import type { Route } from "./types";
import type { MockRouteJson } from "./data/mockRouteLoader";
import mockRouteJson from "./data/mock_route.json";

export default function ResultsPage() {
  const [routes, setRoutes] = useState<Route[]>(() => [mockRouteToRoute(mockRouteJson as MockRouteJson)]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const updateStopCoordinates = useCallback(
    (routeId: string, stopId: string, lat: number, lng: number) => {
      setRoutes((prev) =>
        prev.map((route) => {
          if (route.vehicleId !== routeId) return route;
          return {
            ...route,
            stops: route.stops.map((s) =>
              s.id === stopId ? { ...s, lat, lng } : s
            ),
          };
        })
      );
    },
    [setRoutes]
  );

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center gap-2 p-4 shrink-0 border-b border-zinc-200 bg-white">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-zinc-800">Results – Route map</h1>
      </header>
      <div className="flex flex-1 min-h-0">
        <div
          className={`shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out ${isSidebarOpen ? "w-72" : "w-0"}`}
        >
          <Sidebar
            routes={routes}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onUpdateStopNote={updateStopNote}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <MapComponent
              routes={routes}
              isEditMode={isEditMode}
              onUpdateStopCoordinates={updateStopCoordinates}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
