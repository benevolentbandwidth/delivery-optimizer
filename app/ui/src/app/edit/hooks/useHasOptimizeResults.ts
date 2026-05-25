"use client";

import { useSyncExternalStore } from "react";
import { readHasOptimizeResults } from "../utils/hasOptimizeResults";

/** True when sessionStorage has optimized routes (client only). */
export function useHasOptimizeResults(): boolean {
  return useSyncExternalStore(
    () => () => {},
    readHasOptimizeResults,
    () => false,
  );
}
