/**
 * Pure functions that transform edit-page form state into the shapes
 * expected by the optimization jobs submit route.
 */

import { timeToSeconds } from "@/app/components/AddressGeocoder/utils/timeConversion";
import type { LockedVehicleRow, CapacityUnit } from "../types/delivery";
import type { AddressCard } from "../types/delivery";
import type { VehicleInput } from "@/lib/types/vehicle.types";
import type { DeliveryInput } from "@/lib/types/delivery.types";
import type { Location } from "@/lib/types/common.types";



/**
 * Maps a locked VehicleRow + geocoded location to a VehicleInput for the API.
 * If the vehicle has a departure time, returnTime is set to end-of-day (86400 s)
 * to satisfy the "both or neither" constraint in the vehicle schema.
 */
export function vehicleRowToVehicleInput(
  v: LockedVehicleRow,
  location: Location
): VehicleInput {
  const departureSeconds = v.departureTime
    ? timeToSeconds(v.departureTime)
    : undefined;

  return {
    id: v.id,
    vehicleType: v.type,
    driverName: v.name,
    startLocation: location,
    capacity: {
      type: v.capacityUnit,
      value: v.capacity,
    },
    ...(departureSeconds !== undefined && {
      departureTime: departureSeconds,
      returnTime: 86400,
    }),
  };
}

/**
 * Maps a locked AddressCard + geocoded location to a DeliveryInput for the API.
 */
export function addressCardToDeliveryInput(
  a: AddressCard,
  location: Location,
  demandType: CapacityUnit
): DeliveryInput {
  const { deliveryTimeStart: start, deliveryTimeEnd: end } = a;
  let timeWindow: [number, number] | undefined;
  if (start && end) {
    timeWindow = [timeToSeconds(start), timeToSeconds(end)];
  } else if (start) {
    timeWindow = [timeToSeconds(start), 86400];
  } else if (end) {
    timeWindow = [0, timeToSeconds(end)];
  }

  const recipientNameTrimmed = (a.recipientName ?? "").trim();
  const phoneRaw = a.phoneNumber ?? "";
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const notesTrimmed = (a.notes ?? "").trim();

  return {
    id: a.id,
    recipientName: recipientNameTrimmed || undefined,
    phoneNumber: phoneDigits.length >= 10 ? phoneRaw.trim() : undefined,
    address: a.recipientAddress,
    notes: notesTrimmed || undefined,
    location,
    bufferTime: a.timeBuffer > 0 ? a.timeBuffer * 60 : 0,
    demand: { type: demandType, value: a.deliveryQuantity },
    ...(timeWindow && { timeWindows: [timeWindow] }),
  };
}
