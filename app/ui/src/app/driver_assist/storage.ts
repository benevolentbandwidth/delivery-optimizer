import {
  createPersistedRouteState,
  parsePersistedRouteState,
} from "@/lib/driver-route/importSession";
import type { DriverRoute } from "@/lib/driver-route/types";

export const STORAGE_KEY = "driver_assist.routeState";
export const UPLOADED_ROUTE_KEY = "routeFile";

export type UploadedRouteFile = {
  name: string;
  content: string;
};

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
export function readUploadedRouteFile(): UploadedRouteFile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(UPLOADED_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UploadedRouteFile>;
    if (typeof parsed.name !== "string" || typeof parsed.content !== "string") {
      return null;
    }
    return { name: parsed.name, content: parsed.content };
  } catch {
    return null;
  }
}

export function clearUploadedRouteFile() {
  window.sessionStorage.removeItem(UPLOADED_ROUTE_KEY);
}

// Store the route with a small version wrapper so future shape changes have room.
export function persistRoute(route: DriverRoute) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(createPersistedRouteState(route)),
  );
}
