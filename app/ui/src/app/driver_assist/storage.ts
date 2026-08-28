import {
  createPersistedRouteState,
  parsePersistedRouteState,
} from "@/lib/driver-route/importSession";
import type { DriverRoute } from "@/lib/driver-route/types";

export const STORAGE_KEY = "driver_assist.routeState";
export const ROUTE_STORE_EVENT = "driver-assist-route-store-updated";

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

// Store the route with a small version wrapper so future shape changes have room.
export function persistRoute(route: DriverRoute) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(createPersistedRouteState(route)),
  );
  window.dispatchEvent(new Event(ROUTE_STORE_EVENT));
}
