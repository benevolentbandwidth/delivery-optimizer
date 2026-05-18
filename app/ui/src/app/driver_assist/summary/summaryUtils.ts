import type { DeliveryStatus, DeliveryStop } from "@/lib/driver-route/types";

export function statusLabel(status: DeliveryStatus) {
  // Failed and pending stops are both still unresolved from the summary view.
  if (status === "completed") return "Complete";
  return "Remaining";
}

export function stopTimestamp(stop: DeliveryStop) {
  // Prefer the completed time, then the driver's issue note, then a plain empty
  // state for stops that were never touched.
  if (stop.completedAt) {
    return `Delivered at ${new Date(stop.completedAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  if (stop.failureReason) {
    return `Attempted: ${stop.failureReason}`;
  }

  return "Not completed";
}
