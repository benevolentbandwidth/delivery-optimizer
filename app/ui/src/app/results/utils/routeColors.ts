// Colors go in list order: first route uses palette[0], second uses palette[1], etc.
// More routes than colors → wrap back to the start. Swap the hex list later; keep this shape.

const PALETTE = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#d97706",
  "#059669",
  "#4f46e5",
  "#b45309",
] as const;

/** `routeIndex` = 0-based position in the routes array (same order as "Route 1", "Route 2", …). */
export function routeColorHex(routeIndex: number): string {
  return PALETTE[routeIndex % PALETTE.length]!;
}
