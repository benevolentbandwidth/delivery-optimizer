"use client";

import { useEffect, useState } from "react";
import { readHasOptimizeResults } from "../utils/hasOptimizeResults";

/** Session storage flag for optimized routes; read once after mount. */
export function useHasOptimizeResults(): boolean {
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    setHasResults(readHasOptimizeResults());
  }, []);

  return hasResults;
}
