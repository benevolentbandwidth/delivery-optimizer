// Results page: route list + map

"use client";

import { default as React, useCallback, useEffect, useState } from "react";
import { NAVBAR_V2_LOGO, NAVBAR_V2_ROOT } from "../edit/formStyles.v2";
import styles from "../edit/edit.module.css";
import MobileSidebar from "../components/sidebar/MobileSidebar";
import ExportEditWarningModal from "./components/ExportEditWarningModal";
import ExportRoutesModal from "./components/ExportRoutesModal";
import MapComponent from "./components/Map";
import MobileResultsNavbar from "./components/MobileResultsNavbar";
import ResultsBottomSheet from "./components/ResultsBottomSheet";
import ResultsNavRail from "./components/ResultsNavRail";
import Sidebar from "./components/Sidebar";
import { mockRouteToRoute } from "./data/mockRouteLoader";
import mockRouteData from "./data/mock_route.json";
import {
  RESULTS_MOBILE_EDIT_BANNER_MESSAGE,
  RESULTS_MOBILE_EDIT_PILL,
} from "./formStyles.mobile";
import type { PendingPinMove, Route } from "./types";
import { downloadRoutesAsJsonFiles } from "./utils/downloadRouteJson";

function readInitialRoutes(): {
  routes: Route[];
  error: string | null;
  loadedFromSessionStorage: boolean;
} {
  if (typeof window === "undefined") {
    return { routes: [], error: null, loadedFromSessionStorage: false };
  }
  const forceMock = new URLSearchParams(window.location.search).get("mock");
  // Intentional demo: ?mock=1 loads fixture routes for visual QA without running optimize.
  if (forceMock === "1") {
    return {
      routes: [mockRouteToRoute(mockRouteData)],
      error: null,
      loadedFromSessionStorage: false,
    };
  }

  const stored = sessionStorage.getItem("optimizeResults");
  if (!stored) {
    // Intentional demo fallback: direct /results visits (no prior optimize) render mock
    // routes so the hi-fi UI can be reviewed without a full optimize flow.
    return {
      routes: [mockRouteToRoute(mockRouteData)],
      error: null,
      loadedFromSessionStorage: false,
    };
  }

  try {
    const parsed = JSON.parse(stored) as Route[];
    return { routes: parsed, error: null, loadedFromSessionStorage: true };
  } catch {
    return {
      routes: [],
      error:
        "Could not read saved route data. Please run optimize again from the edit page.",
      loadedFromSessionStorage: false,
    };
  }
}

export default function ResultsPage() {
  const [
    { routes: initialRoutes, error: initialError, loadedFromSessionStorage },
  ] = useState(readInitialRoutes);

  useEffect(() => {
    if (loadedFromSessionStorage) {
      sessionStorage.removeItem("optimizeResults");
    }
  }, [loadedFromSessionStorage]);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [error] = useState<string | null>(initialError);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingPinMove, setPendingPinMove] = useState<PendingPinMove | null>(
    null,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [exportWarningOpen, setExportWarningOpen] = useState(false);

  const updateStopNote = useCallback(
    (routeId: string, stopId: string, note: string) => {
      setRoutes((prev) =>
        prev.map((route) => {
          if (route.vehicleId !== routeId) return route;
          return {
            ...route,
            stops: route.stops.map((s) =>
              s.id === stopId ? { ...s, note } : s,
            ),
          };
        }),
      );
    },
    [setRoutes],
  );

  const handleRouteDistanceUpdate = useCallback(
    (vehicleId: string, distanceMi: number) => {
      setRoutes((prev) => {
        const next = prev.map((route) =>
          route.vehicleId === vehicleId && route.distanceMi !== distanceMi
            ? { ...route, distanceMi }
            : route,
        );
        return next.every((r, i) => r === prev[i]) ? prev : next;
      });
    },
    [],
  );

  const handleEditModeChange = useCallback((value: boolean) => {
    setIsEditMode(value);
    if (!value) setPendingPinMove(null);
    if (value) setIsSheetExpanded(true);
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
                  : { ...s, lat: pendingPinMove.lat, lng: pendingPinMove.lng },
              ),
            },
      ),
    );
    setPendingPinMove(null);
  }, [pendingPinMove]);

  const handlePendingPinMove = useCallback(
    (vehicleId: string, stopId: string, lat: number, lng: number) => {
      setPendingPinMove({ vehicleId, stopId, lat, lng });
    },
    [],
  );

  const cancelPendingPinMove = useCallback(() => setPendingPinMove(null), []);

  const exitEditMode = useCallback(() => {
    handleEditModeChange(false);
  }, [handleEditModeChange]);

  const handleMobileCancel = useCallback(() => {
    if (pendingPinMove != null) {
      cancelPendingPinMove();
    } else {
      exitEditMode();
    }
  }, [pendingPinMove, cancelPendingPinMove, exitEditMode]);

  const handleExportClick = useCallback(() => {
    if (isEditMode || pendingPinMove != null) {
      setExportWarningOpen(true);
      return;
    }
    setExportOpen(true);
  }, [isEditMode, pendingPinMove]);

  const handleDoneEditingForExport = useCallback(() => {
    handleEditModeChange(false);
    setExportWarningOpen(false);
    setExportOpen(true);
  }, [handleEditModeChange]);

  const handleExportSingleRoute = useCallback(
    (vehicleId: string) => {
      if (isEditMode || pendingPinMove != null) {
        setExportWarningOpen(true);
        return;
      }
      const routeIndex = routes.findIndex((r) => r.vehicleId === vehicleId);
      if (routeIndex === -1) return;
      downloadRoutesAsJsonFiles(routes, (_, i) => i === routeIndex);
    },
    [routes, isEditMode, pendingPinMove],
  );

  const handleDuplicateRoute = useCallback((vehicleId: string) => {
    setRoutes((prev) => {
      const routeIndex = prev.findIndex((r) => r.vehicleId === vehicleId);
      if (routeIndex === -1) return prev;
      const source = prev[routeIndex]!;
      const suffix = Date.now().toString(36);
      const copy: Route = {
        ...source,
        vehicleId: `${source.vehicleId}-copy-${suffix}`,
        driverName: `${source.driverName} (copy)`,
        stops: source.stops.map((stop, stopIndex) => ({
          ...stop,
          id: `${stop.id}-copy-${suffix}-${stopIndex}`,
        })),
      };
      return [
        ...prev.slice(0, routeIndex + 1),
        copy,
        ...prev.slice(routeIndex + 1),
      ];
    });
  }, []);

  const handleDeleteRoute = useCallback(
    (vehicleId: string) => {
      setRoutes((prev) => prev.filter((r) => r.vehicleId !== vehicleId));
      if (pendingPinMove?.vehicleId === vehicleId) {
        setPendingPinMove(null);
      }
    },
    [pendingPinMove],
  );

  return (
    <main
      className={`h-screen flex flex-col overflow-hidden font-sans-manrope ${styles.root}`}
    >
      <ExportRoutesModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        routes={routes}
      />
      <ExportEditWarningModal
        isOpen={exportWarningOpen}
        onClose={() => setExportWarningOpen(false)}
        onDoneEditing={handleDoneEditingForExport}
      />
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
      )}{" "}
      {/* Map container switched to h-screen and added overflow hidden so the page is forced to be exactly one screen tall, whereas before the page was allowed to get taller than browser window leading to a long scroll */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <header
        className={`${NAVBAR_V2_ROOT} hidden lg:flex shrink-0 border-b border-[var(--edit-stone-200)]`}
      >
        <p className={NAVBAR_V2_LOGO}>DELIVERY OPTIMIZER</p>
        <div className="ml-auto flex items-center gap-2">
          {pendingPinMove != null && (
            <>
              <button
                type="button"
                onClick={cancelPendingPinMove}
                className="h-9 px-4 rounded-[6px] border border-[var(--edit-stone-700)] font-semibold text-sm text-[var(--edit-text-primary)] hover:bg-[var(--edit-secondary-btn-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePendingPinMove}
                className="h-9 px-4 rounded-[6px] bg-[var(--edit-btn-primary)] font-semibold text-sm text-[var(--edit-text-primary)] hover:brightness-[0.97]"
              >
                Save
              </button>
            </>
          )}
        </div>
      </header>
      <div className="hidden lg:flex flex-1 min-h-0">
        <ResultsNavRail />
        {/* Hi-fi routes panel width (28rem); always visible on desktop */}
        <div className="shrink-0 h-full w-[28rem] overflow-hidden">
          <Sidebar
            routes={routes}
            isEditMode={isEditMode}
            onEditModeChange={handleEditModeChange}
            onUpdateStopNote={updateStopNote}
            onExportAllRoutes={handleExportClick}
            onExportRoute={handleExportSingleRoute}
            onDuplicateRoute={handleDuplicateRoute}
            onDeleteRoute={handleDeleteRoute}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            {isEditMode && (
              <p className={RESULTS_MOBILE_EDIT_PILL} role="status">
                {RESULTS_MOBILE_EDIT_BANNER_MESSAGE}
              </p>
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
      <div className="lg:hidden relative flex flex-1 min-h-0 flex-col">
        <MobileResultsNavbar
          onMenuClick={() => setIsMobileMenuOpen(true)}
          showCancel={pendingPinMove != null}
          onSave={savePendingPinMove}
          onCancel={handleMobileCancel}
          saveDisabled={isEditMode && pendingPinMove == null}
        />
        <div className="relative flex flex-1 min-h-0 flex-col">
          {isEditMode && (
            <p className={RESULTS_MOBILE_EDIT_PILL} role="status">
              {RESULTS_MOBILE_EDIT_BANNER_MESSAGE}
            </p>
          )}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <MapComponent
              routes={routes}
              isEditMode={isEditMode}
              pendingPinMove={pendingPinMove}
              onPendingPinMove={handlePendingPinMove}
              onRouteDistanceUpdate={handleRouteDistanceUpdate}
            />
          </div>
        </div>
        <ResultsBottomSheet
          routes={routes}
          isExpanded={isSheetExpanded}
          onExpandedChange={setIsSheetExpanded}
          isEditMode={isEditMode}
          onEditModeChange={handleEditModeChange}
          onExportClick={handleExportClick}
          onUpdateStopNote={updateStopNote}
          onExportRoute={handleExportSingleRoute}
          onDuplicateRoute={handleDuplicateRoute}
          onDeleteRoute={handleDeleteRoute}
        />
      </div>
    </main>
  );
}
