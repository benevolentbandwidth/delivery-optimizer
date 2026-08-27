import { parseCsvToRows } from "@/app/edit/hooks/useCSVImport";
import { loadDriverRouteFromText } from "@/lib/driver-route/importSession";
import type { DeliveryStop, DriverRoute } from "@/lib/driver-route/types";

export const ROUTE_UPLOAD_ERROR_KEY = "routeUploadError";

export function parseRouteUploadText(text: string) {
  return loadDriverRouteFromText(text);
}

export function parseRouteUploadFile(name: string, text: string) {
  if (name.toLowerCase().endsWith(".csv")) {
    return parseRouteCsvText(text);
  }

  return parseRouteUploadText(text);
}

function parseRouteCsvText(text: string): DriverRoute {
  const rows = parseCsvToRows(text);
  if (rows.length < 2) {
    throw new Error(
      "CSV file must include a header row and at least one stop.",
    );
  }

  const headers = rows[0].map(normalizeHeader);
  const stops = rows.slice(1).map((row, index) => {
    const value = (names: string[]) => {
      const headerIndex = headers.findIndex((header) => names.includes(header));
      return headerIndex >= 0 ? row[headerIndex]?.trim() || "" : "";
    };

    const latStr = value(["lat", "latitude"]);
    const lngStr = value(["lng", "lon", "long", "longitude"]);
    if (
      !latStr ||
      !lngStr ||
      !Number.isFinite(Number(latStr)) ||
      !Number.isFinite(Number(lngStr))
    ) {
      throw new Error(
        "CSV route stops must include valid lat and lng columns.",
      );
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    const sequence = Number(value(["sequence", "stopnumber", "stop"]));
    const packageCountText = value([
      "capacityused",
      "packagecount",
      "packages",
      "demand",
    ]);
    const packageCount = Number(packageCountText);

    return {
      id: value(["id", "stopid"]) || String(index + 1),
      stopNumber:
        Number.isFinite(sequence) && sequence > 0 ? sequence : index + 1,
      address: value(["address"]) || "No address provided",
      customerName:
        value(["addresseename", "recipientname", "customername", "name"]) ||
        `Stop ${index + 1}`,
      phoneNumber: value(["phonenumber", "phone"]) || undefined,
      packageCount:
        packageCountText !== "" &&
        Number.isFinite(packageCount) &&
        packageCount >= 0
          ? packageCount
          : 1,
      notes: value(["note", "notes"]) || "",
      status: "pending",
      lat,
      lng,
      completedAt: undefined,
      failureReason: undefined,
    } satisfies DeliveryStop;
  });

  stops.sort((a, b) => a.stopNumber - b.stopNumber);

  return {
    driverName: "driver_assist",
    routeLabel: `CSV route - ${stops.length} stops`,
    stops: stops.map((stop, index) => ({ ...stop, stopNumber: index + 1 })),
  };
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}
