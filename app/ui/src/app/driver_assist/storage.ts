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

export function readSavedRoute(): DriverRoute | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return parsePersistedRouteState(JSON.parse(saved)).route;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

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

export function persistRoute(route: DriverRoute) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(createPersistedRouteState(route)),
  );
}
