import type { Route, Stop } from "@/app/results/types";
import { timeToSeconds } from "@/app/components/AddressGeocoder/utils/timeConversion";
import { MAX_CAPACITY, MAX_DEMAND } from "@/lib/validation/common.schema";
import {
  sessionSaveV1Schema,
  type SessionSaveData,
  type SessionSaveV1,
} from "@/lib/validation/session.schema";

const SECONDS_PER_DAY = 86_400;
const END_OF_DAY = SECONDS_PER_DAY - 1;

// The driver app reads only vehicles[0], so every route PDF carries exactly one.
const SINGLE_VEHICLE_ID = 1;

type DeliveryInput = SessionSaveData["deliveries"][number];
type VehicleInput = SessionSaveData["vehicles"][number];
type TimeWindow = NonNullable<DeliveryInput["timeWindows"]>[number];

function trimmedOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** `phoneNumber` is `.min(10)`, so anything shorter is dropped rather than rejected. */
function normalizePhoneNumber(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/[^\d+]/g, "") ?? "";
  return cleaned.length >= 10 ? cleaned : undefined;
}

/**
 * Route.vehicleType comes from VehicleRow.type and is already narrowed upstream,
 * but the results type is a plain string, so normalize defensively.
 */
function normalizeVehicleType(
  value: string | undefined,
): VehicleInput["vehicleType"] {
  switch (value?.trim().toLowerCase()) {
    case "truck":
    case "van":
    case "lorry":
      return "truck";
    case "bicycle":
    case "bike":
    case "e-bike":
    case "ebike":
      return "bicycle";
    default:
      return "car";
  }
}

/** `demand.value` must be positive, but capacityUsed is frequently 0. */
function positiveQuantity(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return Math.min(Math.round(value), max);
}

function requireLocation(
  stop: Stop,
  position: number,
): DeliveryInput["location"] {
  const { lat, lng } = stop;
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!valid) {
    throw new Error(
      `Stop ${position} is missing valid coordinates and cannot be sent.`,
    );
  }

  return { lat, lng };
}

function parseClockTime(value: string | undefined): number | undefined {
  const trimmed = trimmedOrUndefined(value);
  if (!trimmed) return undefined;

  const seconds = timeToSeconds(trimmed);
  return Number.isInteger(seconds) && seconds >= 0 && seconds < SECONDS_PER_DAY
    ? seconds
    : undefined;
}

/**
 * Derive a VROOM time window from the customer-requested delivery window.
 * `timeWindow.time` is the predicted arrival, not a constraint, so it is
 * deliberately excluded here — it only appears on the printed page.
 */
function deliveryTimeWindows(stop: Stop): TimeWindow[] | undefined {
  const start = parseClockTime(stop.deliveryWindowStart);
  const end = parseClockTime(stop.deliveryWindowEnd);

  if (start !== undefined && end !== undefined) {
    return end > start ? [[start, end]] : undefined;
  }
  if (end !== undefined) {
    return end > 0 ? [[0, end]] : undefined;
  }
  if (start !== undefined) {
    return start < END_OF_DAY ? [[start, END_OF_DAY]] : undefined;
  }
  return undefined;
}

function orderedStops(route: Route): Stop[] {
  return [...route.stops].sort((a, b) => a.sequence - b.sequence);
}

function toDelivery(stop: Stop, index: number): DeliveryInput {
  const position = index + 1;
  const recipientName = trimmedOrUndefined(stop.addresseeName);
  const phoneNumber = normalizePhoneNumber(stop.phoneNumber);
  const address = trimmedOrUndefined(stop.address);
  const notes = trimmedOrUndefined(stop.note);
  const timeWindows = deliveryTimeWindows(stop);

  return {
    // Positional rather than parsed from Stop.id ("stop-1"): guarantees
    // uniqueness and numeric-ness, and the driver app only uses it as a key.
    id: position,
    location: requireLocation(stop, position),
    demand: {
      type: "units",
      value: positiveQuantity(stop.capacityUsed, MAX_DEMAND),
    },
    // Optional string fields are omitted rather than sent empty: the schema
    // enforces min lengths that "" would fail.
    ...(recipientName && { recipientName }),
    ...(phoneNumber && { phoneNumber }),
    ...(address && { address }),
    ...(notes && { notes }),
    ...(timeWindows && { timeWindows }),
  };
}

function toVehicle(route: Route, deliveries: DeliveryInput[]): VehicleInput {
  const totalDemand = deliveries.reduce((sum, d) => sum + d.demand.value, 0);
  const driverName = trimmedOrUndefined(route.driverName);
  const departureTime = parseClockTime(route.startTime);

  return {
    id: SINGLE_VEHICLE_ID,
    vehicleType: normalizeVehicleType(route.vehicleType),
    capacity: {
      type: "units",
      value: positiveQuantity(totalDemand, MAX_CAPACITY),
    },
    ...(driverName && { driverName }),
    ...(route.startLocation && {
      startLocation: {
        lat: route.startLocation.lat,
        lng: route.startLocation.lng,
      },
    }),
    // departureTime and returnTime are both-or-neither, and returnTime must be
    // later; end-of-day matches the convention in sessionMapper.ts.
    ...(departureTime !== undefined && {
      departureTime,
      returnTime: SECONDS_PER_DAY,
    }),
  };
}

/**
 * Convert a results-page Route into the save-file shape the driver app imports.
 *
 * Stops are emitted in optimized order because transformSessionToDriverRoute
 * numbers them by array position — it does not sort.
 */
export function routeToSessionSaveData(route: Route): SessionSaveData {
  const deliveries = orderedStops(route).map(toDelivery);

  if (deliveries.length === 0) {
    throw new Error("This route has no stops to send.");
  }

  return { deliveries, vehicles: [toVehicle(route, deliveries)] };
}

/**
 * Wrap the route data in the versioned envelope and validate it, so a PDF can
 * never ship with an embedded payload the driver app would refuse to load.
 */
export function routeToSessionSaveFile(
  route: Route,
  savedAt: string,
): SessionSaveV1 {
  return sessionSaveV1Schema.parse({
    version: 1,
    savedAt,
    data: routeToSessionSaveData(route),
  });
}
