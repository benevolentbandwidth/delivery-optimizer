// Colors go in list order: first route uses palette[0], second uses palette[1], etc.

const PALETTE = [
  "#1E90B5",
  "#C84F63",
  "#3B4B86",
  "#D57303",
  "#50881F",
] as const;

export function routeColorHex(routeIndex: number): string {
  return PALETTE[routeIndex % PALETTE.length]!;
}
