"use client";

/**
 * One vehicle in the list: Figma desktop summary row or mobile locked card.
 *
 * The `layout` prop is kept because mobile vs desktop differ in real structure (stacked card vs
 * grid fragments), not only responsive CSS on one tree.
 */

import type { VehicleRow as VehicleRowType, VehicleType } from "../types/delivery";
import { capitalize } from "../utils/deliveryHelpers";
import {
  VEHICLE_ROW_CELL,
  VEHICLE_ROW_ACTIONS,
  VEHICLE_ROW_DESKTOP,
  VEHICLE_ROW_STATUS_BADGE_AVAILABLE,
  VEHICLE_ROW_STATUS_BADGE_IN_USE,
  VEHICLE_ROW_STATUS_CELL,
  VEHICLE_ROW_STATUS_TEXT_AVAILABLE,
  VEHICLE_ROW_STATUS_TEXT_IN_USE,
  VEHICLE_MOBILE_LOCKED_CARD_V2,
  VEHICLE_MOBILE_LOCKED_HEADER,
  VEHICLE_MOBILE_LOCKED_INFO,
  VEHICLE_MOBILE_LOCKED_NAME,
  VEHICLE_MOBILE_LOCKED_SUBTITLE,
  VEHICLE_MOBILE_LOCKED_ICON_ROW,
  VEHICLE_MOBILE_LOCKED_STATUS_ROW,
  VEHICLE_MOBILE_LOCKED_DEPARTURE,
} from "../formStyles.v2";
import { EditIconButton, DeleteIconButton } from "./RowIconButtons";

type VehicleLayout = "desktop" | "mobile";

type VehicleRowProps = {
  layout?: VehicleLayout;
  vehicle: VehicleRowType;
  updateVehicle: <K extends keyof VehicleRowType>(id: number, key: K, value: VehicleRowType[K]) => void;
  deleteVehicle: (id: number) => void;
  onEditVehicle?: (vehicle: VehicleRowType) => void;
  vehicleTouched: boolean;
  geocodeFailed: boolean;
  outOfRegionFailed: boolean;
};

export default function VehicleRow({
  layout = "desktop",
  vehicle: v,
  deleteVehicle,
  onEditVehicle,
}: VehicleRowProps) {
  const statusBadge = v.available ? VEHICLE_ROW_STATUS_BADGE_AVAILABLE : VEHICLE_ROW_STATUS_BADGE_IN_USE;
  const statusText = v.available ? VEHICLE_ROW_STATUS_TEXT_AVAILABLE : VEHICLE_ROW_STATUS_TEXT_IN_USE;

  if (layout === "mobile") {
    return (
      <div className={VEHICLE_MOBILE_LOCKED_CARD_V2}>
        <div className={VEHICLE_MOBILE_LOCKED_HEADER}>
          <div className={VEHICLE_MOBILE_LOCKED_INFO}>
            <span className={VEHICLE_MOBILE_LOCKED_NAME}>{v.name}</span>
            <span className={VEHICLE_MOBILE_LOCKED_SUBTITLE}>
              <span>{capitalize(v.type)}</span>
              <span>•</span>
              <span>{formatCapacity(v)}</span>
            </span>
          </div>
          <div className={VEHICLE_MOBILE_LOCKED_ICON_ROW}>
            <EditIconButton name={v.name} onClick={() => onEditVehicle?.(v)} />
            <DeleteIconButton name={v.name} onClick={() => deleteVehicle(v.id)} />
          </div>
        </div>
        <div className={VEHICLE_MOBILE_LOCKED_STATUS_ROW}>
          <span className={statusBadge}>
            <span className={statusText}>{v.available ? "Available" : "In use"}</span>
          </span>
          <span className={VEHICLE_MOBILE_LOCKED_DEPARTURE}>
            {(v.departureTime || "--:--") + " departure time"}
          </span>
        </div>
      </div>
    );
  }

  // --- Desktop layout ---

  return (
    <div className={VEHICLE_ROW_DESKTOP}>
      <span className={VEHICLE_ROW_CELL}>{v.name}</span>
      <span className={VEHICLE_ROW_CELL}>{capitalize(v.type as VehicleType)}</span>
      <span className={VEHICLE_ROW_CELL}>{formatCapacity(v)}</span>
      <span className={VEHICLE_ROW_STATUS_CELL}>
        <span className={statusBadge}>
          <span className={statusText}>{v.available ? "Available" : "In use"}</span>
        </span>
      </span>
      <span className={VEHICLE_ROW_CELL}>{v.departureTime}</span>
      <div className={VEHICLE_ROW_ACTIONS}>
        <EditIconButton name={v.name} onClick={() => onEditVehicle?.(v)} />
        <DeleteIconButton name={v.name} onClick={() => deleteVehicle(v.id)} />
      </div>
    </div>
  );
}

function formatCapacity(vehicle: VehicleRowType): string {
  const unit =
    vehicle.capacityUnit === "cubic_feet"
      ? "Cubic Feet"
      : vehicle.capacityUnit;

  return [vehicle.capacity || "", unit].filter(Boolean).join(" ");
}
