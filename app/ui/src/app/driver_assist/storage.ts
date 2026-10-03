import {
  createPersistedRouteState,
  parsePersistedRouteState,
} from "@/lib/driver-route/importSession";
import type { DriverRoute } from "@/lib/driver-route/types";

export const STORAGE_KEY = "driver_assist.routeState";
export const UPLOADED_ROUTE_KEY = "driver_assist.uploadedRoute";

// Saved progress is the driver's working copy of the route.
export function readSavedRoute(): DriverRoute | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return parsePersistedRouteState(JSON.parse(saved)).route;
  } catch {
    // Bad localStorage should not strand the driver on a broken route.
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// The upload page only needs a short handoff, so sessionStorage is enough.
export function readUploadedRoute(): DriverRoute | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(UPLOADED_ROUTE_KEY);
    if (!raw) return null;
    return parsePersistedRouteState(JSON.parse(raw)).route;
  } catch {
    try {
      window.sessionStorage.removeItem(UPLOADED_ROUTE_KEY);
    } catch {
      // Storage may be unavailable; the invalid handoff is still ignored.
    }
    return null;
  }
}

export function storeUploadedRoute(route: DriverRoute) {
  window.sessionStorage.setItem(
    UPLOADED_ROUTE_KEY,
    JSON.stringify(createPersistedRouteState(route)),
  );
}

export function clearUploadedRoute() {
  try {
    window.sessionStorage.removeItem(UPLOADED_ROUTE_KEY);
  } catch {
    // Storage may be unavailable; route state has already been read in memory.
  }
}

// Store the route with a small version wrapper so future shape changes have room.
export function persistRoute(route: DriverRoute) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(createPersistedRouteState(route)),
  );
}
