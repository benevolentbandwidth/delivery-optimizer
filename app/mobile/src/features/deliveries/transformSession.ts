import type { DriverRoute, DeliveryStop, OptimizeRequestLike } from './types';

export function transformSessionToDriverRoute(input: OptimizeRequestLike): DriverRoute {
  const deliveries = Array.isArray(input.deliveries) ? input.deliveries : [];
  const vehicle = Array.isArray(input.vehicles) ? input.vehicles[0] : undefined;

  const stops: DeliveryStop[] = deliveries.map((delivery, index) => ({
    id: String(delivery.id),
    stopNumber: index + 1,
    address: delivery.address ?? 'No address provided',
    customerName: delivery.recipientName ?? `Customer ${index + 1}`,
    packageCount: delivery.demand?.value ?? 1,
    notes: delivery.notes ?? '',
    status: 'pending',
    completedAt: undefined,
  }));

  return {
    driverName: vehicle?.driverName ?? 'Driver Assist',
    routeLabel: `Route X · ${stops.length} stops`,
    stops,
  };
}
