import type { DeliveryStop, DriverRoute, OptimizeRequestLike } from "./types";

export function transformSessionToDriverRoute(
  input: OptimizeRequestLike,
): DriverRoute {
  // The driver PWA only needs the ordered stops and the first assigned driver.
  const deliveries = input.deliveries || [];
  const firstVehicle = input.vehicles?.[0];

  const stops: DeliveryStop[] = deliveries.map((delivery, index) => {
    return {
      id: String(delivery.id),
      stopNumber: index + 1,
      address: delivery.address || "No address provided",
      customerName: delivery.recipientName || `Recipient ${index + 1}`,
      phoneNumber: delivery.phoneNumber,
      packageCount: delivery.demand?.value ?? 1,
      notes: delivery.notes || "",
      // A freshly imported route always starts as work to be done.
      status: "pending",
      lat: delivery.location?.lat || 0,
      lng: delivery.location?.lng || 0,
      completedAt: undefined,
      failureReason: undefined,
    };
  });

  return {
    driverName: firstVehicle?.driverName || "driver_assist",
    // Keep this human-readable; it shows up in exported route summaries.
    routeLabel: `Route ${firstVehicle?.id || "1"} - ${stops.length} stops`,
    stops,
  };
}
