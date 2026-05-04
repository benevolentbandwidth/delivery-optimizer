// Colors go in list order: first route uses palette[0], second uses palette[1], etc.

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

export function routeColorHex(routeIndex: number): string { // routeIndex (0 = first route, 1 = second route, etc.)
  return PALETTE[routeIndex % PALETTE.length]!; // uses the list in order, and wraps back to the start if there are more routes than colors
}
