"use client";

import { useEffect, useState } from "react";
import type { Route } from "@/app/results/types";

export const OPTIMIZE_RESULTS_STORAGE_KEY = "optimizeResults";

export const OPTIMIZE_RESULTS_UPDATED_EVENT = "optimize-results-updated";

/** True when sessionStorage has at least one route ready for /results. */
export function readHasOptimizeResults(): boolean {
  if (typeof window === "undefined") return false;

  const stored = sessionStorage.getItem(OPTIMIZE_RESULTS_STORAGE_KEY);
  if (!stored) return false;

  try {
    const parsed = JSON.parse(stored) as Route[];
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
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

/** Subscribes to same-tab writes and cross-tab sessionStorage changes. */
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
