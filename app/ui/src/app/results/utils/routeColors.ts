// Colors go in list order: first route uses palette[0], second uses palette[1], etc.

const PALETTE = [
  "#1E90B5",
  "#C84F63",
  "#3B4B86",
  "#D57303",
  "#50881F",
] as const;

export function routeColorHex(routeIndex: number): string {
  // routeIndex (0 = first route, 1 = second route, etc.)
  return PALETTE[routeIndex % PALETTE.length]!; // uses the list in order, and wraps back to the start if there are more routes than colors
}
