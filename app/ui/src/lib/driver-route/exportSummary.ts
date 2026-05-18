import {
  downloadJsonFile,
  filenameTimestamp,
  type SessionExportResult,
} from "@/lib/session/exportSession";

import type { DeliveryStatus, DriverRoute } from "./types";

export type RouteSummaryStop = {
  id: string;
  stopNumber: number;
  customerName: string;
  address: string;
  phoneNumber?: string;
  packageCount: number;
  notes: string;
  status: DeliveryStatus;
  completedAt?: string;
  failureReason?: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type RouteSummaryFile = {
  version: 1;
  exportedAt: string;
  driverName: string;
  routeLabel: string;
  summary: {
    total: number;
    complete: number;
    remaining: number;
  };
  stops: RouteSummaryStop[];
};

export function buildRouteSummary(
  route: DriverRoute,
  now: Date = new Date(),
): RouteSummaryFile {
  const complete = route.stops.filter(
    (stop) => stop.status === "completed",
  ).length;
  const remaining = route.stops.length - complete;

  return {
    version: 1,
    exportedAt: now.toISOString(),
    driverName: route.driverName,
    routeLabel: route.routeLabel,
    summary: {
      total: route.stops.length,
      complete,
      remaining,
    },
    stops: route.stops.map((stop) => ({
      id: stop.id,
      stopNumber: stop.stopNumber,
      customerName: stop.customerName,
      address: stop.address,
      phoneNumber: stop.phoneNumber,
      packageCount: stop.packageCount,
      notes: stop.notes,
      status: stop.status,
      completedAt: stop.completedAt,
      failureReason: stop.failureReason,
      location: {
        lat: stop.lat,
        lng: stop.lng,
      },
    })),
  };
}

export function downloadRouteSummary(route: DriverRoute): SessionExportResult {
  const now = new Date();
  const summary = buildRouteSummary(route, now);
  return downloadJsonFile(
    `route_summary_${filenameTimestamp(now)}.json`,
    summary,
  );
}
