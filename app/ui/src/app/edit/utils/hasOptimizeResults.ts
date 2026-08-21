import type { Route } from "@/app/results/types";

/** True when sessionStorage has at least one route ready for /results. */
export function readHasOptimizeResults(): boolean {
  if (typeof window === "undefined") return false;

  const stored = sessionStorage.getItem("optimizeResults");
  if (!stored) return false;

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export function setOptimizeResults(results: Route[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("optimizeResults", JSON.stringify(results));
  window.dispatchEvent(new Event("optimize-results-updated"));
}

export function clearOptimizeResults(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("optimizeResults");
  window.dispatchEvent(new Event("optimize-results-updated"));
}

let cachedRaw: string | null = null;
let cachedIds: number[] = [];

/** Address ids that appear as a stop in the last completed optimize run. */
export function readOptimizedAddressIds(): number[] {
  if (typeof window === "undefined") return cachedIds;

  const stored = sessionStorage.getItem("optimizeResults");
  if (stored === cachedRaw) return cachedIds;
  cachedRaw = stored;

  try {
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    cachedIds = Array.isArray(parsed)
      ? (parsed as Route[])
          .flatMap((r) => (r.stops ?? []).map((s) => Number(s.id)))
          .filter((n) => !Number.isNaN(n))
      : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}
