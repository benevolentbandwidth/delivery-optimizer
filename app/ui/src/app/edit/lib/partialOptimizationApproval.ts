export type PartialApprovalEvent =
  | "fresh_start"
  | "approve"
  | "dismiss"
  | "run_finished";

export function shouldWarnForOverCapacity(
  demand: number,
  capacity: number,
  allowPartial: boolean,
): boolean {
  return demand > capacity && !allowPartial;
}

export function nextPartialApproval(
  _current: boolean,
  event: PartialApprovalEvent,
): boolean {
  switch (event) {
    case "approve":
      return true;
    case "fresh_start":
    case "dismiss":
    case "run_finished":
      return false;
  }
}

export function capacityWarningMessage(
  totalDemand: number,
  totalCapacity: number,
): string {
  return `Total delivery quantity (${totalDemand}) exceeds total vehicle capacity (${totalCapacity}). Optimize anyway to create a partial route; deliveries that cannot fit within the available capacity will remain unassigned.`;
}
