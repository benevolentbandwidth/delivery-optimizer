import type {
  DeliveryStatus,
  DeliveryStop,
} from "@/lib/driver-route/types";

export function statusLabel(status: DeliveryStatus) {
  if (status === "completed") return "Complete";
  return "Remaining";
}

export function stopTimestamp(stop: DeliveryStop) {
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
