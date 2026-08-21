"use client";

import { useSyncExternalStore } from "react";
import { readOptimizedAddressIds } from "../utils/hasOptimizeResults";

const emptyIds: number[] = [];

/** Address ids included in the last completed optimize run (client only). */
export function useOptimizedAddressIds(): number[] {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("optimize-results-updated", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("optimize-results-updated", onChange);
      };
    },
    readOptimizedAddressIds,
    () => emptyIds,
  );
}
