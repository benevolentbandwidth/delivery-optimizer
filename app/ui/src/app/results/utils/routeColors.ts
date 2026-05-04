// One stable color per vehicle/route id for list + map (same id → same color).

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

function paletteIndex(vehicleId: string): number {
  let h = 0;
  for (let i = 0; i < vehicleId.length; i++) {
    h = (h * 31 + vehicleId.charCodeAt(i)) >>> 0;
  }
  return h % PALETTE.length;
}

export function routeColorHex(vehicleId: string): string {
  return PALETTE[paletteIndex(vehicleId)]!;
}
