import type { Route } from "@/app/results/types";

/** True when sessionStorage has at least one route ready for /results. */
export function readHasOptimizeResults(): boolean {
  if (typeof window === "undefined") return false;

  const stored = sessionStorage.getItem("optimizeResults");
  if (!stored) return false;

  try {
    const parsed = JSON.parse(stored) as Route[];
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}
