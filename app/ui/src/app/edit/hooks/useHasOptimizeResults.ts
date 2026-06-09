"use client";

import { useSyncExternalStore } from "react";
import { readHasOptimizeResults } from "../utils/hasOptimizeResults";

/** True when sessionStorage has optimized routes (client only). */
export function useHasOptimizeResults(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("optimize-results-updated", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("optimize-results-updated", onChange);
      };
    },
    readHasOptimizeResults,
    () => false,
  );
}
