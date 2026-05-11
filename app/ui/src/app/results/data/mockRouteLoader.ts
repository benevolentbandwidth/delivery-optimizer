// Defining the input shape (mock JSON file)
// Then converting it into the output shape defined in types.ts (full Route and Stop objects) so the rest of the app can use it

import type { Route, Stop } from "../types";
import mockRouteData from "./mock_route.json";

export interface MockRouteStop { // Defining the shape of a single stop in the mock route
  id: string;
  lat: number;
  lng: number;
  address: string;
  status: string;
  sequence: number;
}

export interface MockRouteJson { // Defining shape of mock_route.json file
  stops: MockRouteStop[];
}

export function mockRouteToRoute(data: MockRouteJson): Route { // Converting the mock route data into a Route object with stops
  const stops: Stop[] = data.stops.map((s) => ({
    id: s.id,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    sequence: s.sequence,
    capacityUsed: 1,
    timeWindow: { kind: "by" as const, time: "12:00" },
    note: "",
    addresseeName: undefined, // if no name, we show "—"
  }));
  return {
    vehicleId: "mock-vehicle-1",
    driverName: "Joe",
    stops,
    vehicleType: "Van",
    distanceMi: 89,
    estimatedTimeMinutes: 195, // 3h 15m 
  };
}

/** Two routes for sidebar / expanded-card dev work (`/results?mock=1`). */
export function getDevMockRoutes(): Route[] {
  const base = mockRouteToRoute(mockRouteData as MockRouteJson);
  const second: Route = {
    ...base,
    vehicleId: "mock-vehicle-2",
    driverName: "Alex Morgan",
    vehicleType: "Truck",
    distanceMi: 34.2,
    estimatedTimeMinutes: 92,
    stops: base.stops.slice(0, 6).map((s, i) => ({
      ...s,
      id: `v2-${s.id}`,
      lng: s.lng + 0.018,
      sequence: i + 1,
    })),
  };
  return [base, second];
}
