import { parseCsvToRows } from "@/lib/csv/parseCsvToRows";
import {
  createImportedRoute,
  type ImportedRouteStop,
} from "@/lib/driver-route/createImportedRoute";
import { loadDriverRouteFromText } from "@/lib/driver-route/importSession";
import type { DriverRoute } from "@/lib/driver-route/types";

export const ROUTE_UPLOAD_ERROR_KEY = "routeUploadError";
export const MAX_ROUTE_FILE_BYTES = 1024 * 1024;

const JSON_ROUTE_FILE_TYPES = new Set(["application/json", "text/json"]);
const CSV_ROUTE_FILE_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

type RouteUploadFile = Pick<File, "name" | "size" | "type" | "text">;

export function validateRouteUploadFile(
  file: Pick<RouteUploadFile, "name" | "size" | "type">,
) {
  const fileName = file.name.toLowerCase();
  const isJson = fileName.endsWith(".json");
  const isCsv = fileName.endsWith(".csv");
  if (!isJson && !isCsv) {
    throw new Error("Only .json or .csv route files are accepted.");
  }
  if (file.size > MAX_ROUTE_FILE_BYTES) {
    throw new Error("Route files must be 1 MB or smaller.");
  }
  const acceptedTypes = isJson ? JSON_ROUTE_FILE_TYPES : CSV_ROUTE_FILE_TYPES;
  if (file.type && !acceptedTypes.has(file.type.toLowerCase())) {
    throw new Error("The selected file has an unsupported content type.");
  }
}

export async function loadDriverRouteFromFile(file: RouteUploadFile) {
  validateRouteUploadFile(file);
  return parseRouteUploadFile(file.name, await file.text());
}

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

  const headerIndexes = new Map(
    rows[0].map((header, index) => [normalizeHeader(header), index]),
  );
  const stops: ImportedRouteStop[] = rows.slice(1).map((row, index) => {
    const latStr = getRowValue(row, headerIndexes, ["lat", "latitude"]);
    const lngStr = getRowValue(row, headerIndexes, [
      "lng",
      "lon",
      "long",
      "longitude",
    ]);
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
    const sequenceText = getRowValue(row, headerIndexes, [
      "sequence",
      "stopnumber",
      "stop",
    ]);
    const sequence = Number(sequenceText);
    const packageCountText = getRowValue(row, headerIndexes, [
      "capacityused",
      "packagecount",
      "packages",
      "demand",
    ]);
    const packageCount = Number(packageCountText);

    const validPackageCount =
      packageCountText !== "" &&
      Number.isFinite(packageCount) &&
      packageCount >= 0
        ? packageCount
        : undefined;

    return {
      id:
        getRowValue(row, headerIndexes, ["id", "stopid"]) || String(index + 1),
      sequence:
        sequenceText !== "" && Number.isFinite(sequence) && sequence >= 0
          ? sequence
          : index,
      address: getRowValue(row, headerIndexes, ["address"]),
      customerName: getRowValue(row, headerIndexes, [
        "addresseename",
        "recipientname",
        "customername",
        "name",
      ]),
      phoneNumber:
        getRowValue(row, headerIndexes, ["phonenumber", "phone"]) || undefined,
      packageCount: validPackageCount,
      notes: getRowValue(row, headerIndexes, ["note", "notes"]),
      lat,
      lng,
    };
  });

  return createImportedRoute({
    driverName: "driver_assist",
    routeLabel: (stopCount) => `CSV route - ${stopCount} stops`,
    stops,
  });
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getRowValue(
  row: string[],
  headerIndexes: ReadonlyMap<string, number>,
  names: string[],
) {
  for (const name of names) {
    const index = headerIndexes.get(name);
    if (index !== undefined) {
      return row[index]?.trim() || "";
    }
  }
  return "";
}
