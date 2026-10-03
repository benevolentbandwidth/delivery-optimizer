import { createPendingDeliveryStop } from "./createDeliveryStop";
import type { DriverRoute } from "./types";

export type ImportedRouteStop = {
  id: string | number;
  sequence: number;
  address?: string;
  customerName?: string;
  phoneNumber?: string;
  packageCount?: number;
  notes?: string;
  lat: number;
  lng: number;
};

type ImportedRouteInput = {
  driverName: string;
  routeLabel: (stopCount: number) => string;
  stops: ImportedRouteStop[];
};

export function createImportedRoute({
  driverName,
  routeLabel,
  stops,
}: ImportedRouteInput): DriverRoute {
  const orderedStops = [...stops].sort((left, right) =>
    left.sequence === right.sequence ? 0 : left.sequence - right.sequence,
  );

  return {
    driverName,
    routeLabel: routeLabel(orderedStops.length),
    stops: orderedStops.map((stop, index) =>
      createPendingDeliveryStop({
        id: stop.id,
        index,
        address: stop.address,
        customerName: stop.customerName,
        phoneNumber: stop.phoneNumber,
        packageCount: stop.packageCount,
        notes: stop.notes,
        lat: stop.lat,
        lng: stop.lng,
      }),
    ),
  };
}
