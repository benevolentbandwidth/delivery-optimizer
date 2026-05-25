import type { Route } from "../types";

function slugForFilename(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s.slice(0, 48) : "route";
}

export function routeJsonFilename(
  displayRouteNumber: number,
  driverName: string,
): string {
  return `route_${displayRouteNumber}_${slugForFilename(driverName)}.json`;
}

function triggerDownload(filename: string, json: string) {
  try {
    const blob = new Blob([json], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    console.error(`Failed to download ${filename}:`, err);
  }
}

/**
 * One JSON file per route; stagger slightly so browsers allow multiple saves from one gesture.
 * Timeouts are intentionally not tracked — exports are fire-and-forget from a user gesture.
 */
export function downloadRoutesAsJsonFiles(
  orderedRoutes: Route[],
  predicate: (route: Route, zeroBasedIndex: number) => boolean,
  staggerMs = 180,
) {
  let slot = 0;
  for (let i = 0; i < orderedRoutes.length; i++) {
    const route = orderedRoutes[i];
    if (!predicate(route, i)) continue;
    const displayNumber = i + 1;
    const filename = routeJsonFilename(displayNumber, route.driverName);
    const json = JSON.stringify(route, null, 2);
    const delay = slot * staggerMs;
    slot += 1;
    if (delay === 0) {
      triggerDownload(filename, json);
    } else {
      window.setTimeout(() => triggerDownload(filename, json), delay);
    }
  }
}
