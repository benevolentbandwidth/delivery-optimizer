"use client";

/**
 * Vehicle grid: column headers plus one VehicleRow per vehicle, and an Add control below.
 */

import { useState } from "react";
import VehicleRow from "./VehicleRow";
import VehicleEmptyState from "./VehicleEmptyState";
import VehicleDetailsOverlay from "./VehicleDetailsOverlay";
import ConfirmDeletionOverlay from "./ConfirmDeletionOverlay";
import type { VehicleRow as VehicleRowType } from "../types/delivery";
import {
  NAVBAR_V2_BTN_OUTLINE,
  VEHICLE_INFO_CONTAINER,
  VEHICLE_INFO_DIVIDER,
  VEHICLE_INFO_HEADER_ACTIONS,
  VEHICLE_INFO_HEADER_CELL,
  VEHICLE_INFO_HEADER_ROW,
  VEHICLE_INFO_ROWS,
  VEHICLE_SECTION_BTN_GHOST,
  VEHICLE_SECTION_ACTIONS,
  VEHICLE_SECTION_HEADER,
  VEHICLE_SECTION_HEADING,
  VEHICLE_SECTION_SUBHEADING,
  MOBILE_EMPTY_STATE_CONTAINER,
  VEHICLE_MOBILE_LIST,
} from "../formStyles.v2";

const BLANK_VEHICLE: VehicleRowType = {
  id: 0,
  locked: false,
  editingExisting: false,
  name: "",
  startLocation: "",
  type: "",
  capacityUnit: "",
  capacity: 0,
  available: true,
  departureTime: "",
};

type VehicleSectionProps = {
  vehicles: VehicleRowType[];
  addVehicle: () => void;
  addVehicleWithDetails: (
    details: Pick<
      VehicleRowType,
      | "name"
      | "type"
      | "capacity"
      | "capacityUnit"
      | "available"
      | "departureTime"
    >,
  ) => void;
  markAllAvailable: () => void;
  updateVehicle: <K extends keyof VehicleRowType>(
    id: number,
    key: K,
    value: VehicleRowType[K],
  ) => void;
  deleteVehicle: (id: number) => void;
  touchedIds: Set<number>;
  allVehiclesLocked: boolean;
  activeVehicleIsValid: boolean;
  geocodeFailedVehicleIds: number[];
  outOfRegionVehicleIds: number[];
};

export default function VehicleSection({
  vehicles,
  addVehicleWithDetails,
  markAllAvailable,
  updateVehicle,
  deleteVehicle,
  touchedIds,
  allVehiclesLocked,
  activeVehicleIsValid,
  geocodeFailedVehicleIds,
  outOfRegionVehicleIds,
}: VehicleSectionProps) {
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRowType | null>(
    null,
  );
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRowType | null>(
    null,
  );

  function handleDeleteRequest(id: number) {
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) setVehicleToDelete(vehicle);
  }

  const addEnabled = allVehiclesLocked || activeVehicleIsValid;
  const geocodeFailedSet = new Set(geocodeFailedVehicleIds);
  const outOfRegionSet = new Set(outOfRegionVehicleIds);

  function saveExistingVehicle(updated: VehicleRowType) {
    updateVehicle(updated.id, "name", updated.name);
    updateVehicle(updated.id, "type", updated.type);
    updateVehicle(updated.id, "capacity", updated.capacity);
    updateVehicle(updated.id, "capacityUnit", updated.capacityUnit);
    updateVehicle(updated.id, "available", updated.available);
    updateVehicle(updated.id, "departureTime", updated.departureTime);
    setEditingVehicle(null);
  }

  return (
    <section>
      <div className={VEHICLE_SECTION_HEADER}>
        <h2 className={VEHICLE_SECTION_HEADING}>Vehicle details</h2>
        <p className={VEHICLE_SECTION_SUBHEADING}>Manage your delivery fleet</p>
      </div>

      <div className={VEHICLE_SECTION_ACTIONS}>
        <button
          type="button"
          onClick={markAllAvailable}
          className={VEHICLE_SECTION_BTN_GHOST}
        >
          Mark all available
        </button>
        <button
          type="button"
          onClick={() => setIsAddOverlayOpen(true)}
          disabled={!addEnabled}
          className={NAVBAR_V2_BTN_OUTLINE}
        >
          Add vehicle
        </button>
      </div>

      {/* Desktop: card with header + vehicle rows */}
      <div className={VEHICLE_INFO_CONTAINER}>
        <div className={VEHICLE_INFO_HEADER_ROW}>
          <span className={VEHICLE_INFO_HEADER_CELL}>Name</span>
          <span className={VEHICLE_INFO_HEADER_CELL}>Type</span>
          <span className={VEHICLE_INFO_HEADER_CELL}>Capacity</span>
          <span className={VEHICLE_INFO_HEADER_CELL}>Status</span>
          <span className={VEHICLE_INFO_HEADER_CELL}>Departure time</span>
          <span className={VEHICLE_INFO_HEADER_ACTIONS}>Actions</span>
        </div>
        <hr className={VEHICLE_INFO_DIVIDER} />
        <div className={VEHICLE_INFO_ROWS}>
          {vehicles.length === 0 ? (
            <VehicleEmptyState />
          ) : (
            vehicles.map((v) => (
              <VehicleRow
                key={`vehicle-${v.id}`}
                layout="desktop"
                vehicle={v}
                updateVehicle={updateVehicle}
                deleteVehicle={handleDeleteRequest}
                onEditVehicle={setEditingVehicle}
                vehicleTouched={touchedIds.has(v.id)}
                geocodeFailed={geocodeFailedSet.has(v.id)}
                outOfRegionFailed={outOfRegionSet.has(v.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Mobile: bordered empty state */}
      {vehicles.length === 0 && (
        <div className={MOBILE_EMPTY_STATE_CONTAINER}>
          <VehicleEmptyState />
        </div>
      )}

      {/* Mobile: stacked cards */}
      {vehicles.length > 0 && (
        <div className={VEHICLE_MOBILE_LIST}>
          {vehicles.map((v) => (
            <VehicleRow
              key={`vehicle-mobile-${v.id}`}
              layout="mobile"
              vehicle={v}
              updateVehicle={updateVehicle}
              deleteVehicle={handleDeleteRequest}
              onEditVehicle={setEditingVehicle}
              vehicleTouched={touchedIds.has(v.id)}
              geocodeFailed={geocodeFailedSet.has(v.id)}
              outOfRegionFailed={outOfRegionSet.has(v.id)}
            />
          ))}
        </div>
      )}

      {isAddOverlayOpen && (
        <VehicleDetailsOverlay
          vehicle={BLANK_VEHICLE}
          mode="add"
          onClose={() => setIsAddOverlayOpen(false)}
          onSave={(updated) => {
            addVehicleWithDetails({
              name: updated.name,
              type: updated.type,
              capacity: updated.capacity,
              capacityUnit: updated.capacityUnit,
              available: updated.available,
              departureTime: updated.departureTime,
            });
            setIsAddOverlayOpen(false);
          }}
        />
      )}

      {editingVehicle && (
        <VehicleDetailsOverlay
          vehicle={editingVehicle}
          mode="edit"
          onClose={() => setEditingVehicle(null)}
          onSave={saveExistingVehicle}
        />
      )}

      {vehicleToDelete && (
        <ConfirmDeletionOverlay
          title={`Delete "${vehicleToDelete.name}"?`}
          description="Are you sure you want to delete this vehicle entry? This action cannot be undone."
          onClose={() => setVehicleToDelete(null)}
          onConfirm={() => {
            deleteVehicle(vehicleToDelete.id);
            setVehicleToDelete(null);
          }}
        />
      )}
    </section>
  );
}
