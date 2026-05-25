"use client";

import { useEffect, useState } from "react";
import type { Route } from "@/app/results/types";

export const OPTIMIZE_RESULTS_STORAGE_KEY = "optimizeResults";

export const OPTIMIZE_RESULTS_UPDATED_EVENT = "optimize-results-updated";

function isValidRoute(value: unknown): value is Route {
  if (!value || typeof value !== "object") return false;
  const route = value as Record<string, unknown>;
  return typeof route.vehicleId === "string" && Array.isArray(route.stops);
}

function parseStoredRoutes(stored: string): Route[] | null {
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every(isValidRoute)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True when sessionStorage has at least one route ready for /results. */
export function readHasOptimizeResults(): boolean {
  if (typeof window === "undefined") return false;

  const stored = sessionStorage.getItem(OPTIMIZE_RESULTS_STORAGE_KEY);
  if (!stored) return false;

  return parseStoredRoutes(stored) != null;
}

export function notifyOptimizeResultsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPTIMIZE_RESULTS_UPDATED_EVENT));
}

export function setOptimizeResults(routes: Route[]): void {
  sessionStorage.setItem(OPTIMIZE_RESULTS_STORAGE_KEY, JSON.stringify(routes));
  notifyOptimizeResultsUpdated();
}

export function clearOptimizeResults(): void {
  sessionStorage.removeItem(OPTIMIZE_RESULTS_STORAGE_KEY);
  notifyOptimizeResultsUpdated();
}

export function useHasOptimizeResults(): boolean {
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    const sync = () => setHasResults(readHasOptimizeResults());
    sync();

    window.addEventListener(OPTIMIZE_RESULTS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(OPTIMIZE_RESULTS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return hasResults;
}
