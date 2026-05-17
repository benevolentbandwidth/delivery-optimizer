/**
 * Vehicle list state: same lock/edit/confirm pattern as addresses, without pagination.
 */

import { useState, useCallback } from "react";
import type { VehicleRow } from "../types/delivery";

function isVehicleValid(v: VehicleRow): boolean {
  return (
    v.name.trim() !== "" &&
    v.type !== "" &&
    v.capacityUnit !== "" &&
    v.capacity > 0 &&
    v.departureTime.trim() !== ""
  );
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);

  // Set of vehicle IDs whose fields should show validation errors.
  const [touchedIds, setTouchedIds] = useState<Set<number>>(new Set());

  const activeVehicle = vehicles.find((v) => !v.locked);
  const activeVehicleIsValid = !!activeVehicle && isVehicleValid(activeVehicle);
  // Vacuously true for an empty list so "Add vehicle" is enabled from the start.
  const allVehiclesLocked = vehicles.every((v) => v.locked);

  const updateVehicle = useCallback(<K extends keyof VehicleRow>(
    id: number,
    key: K,
    value: VehicleRow[K]
  ) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              [key]: value,
              ...(key === "startLocation" ? { cachedLocation: undefined } : {}),
            }
          : v
      )
    );
  }, []);

  const addVehicle = useCallback(() => {
    setVehicles((prev) => {
      const active = prev.find((v) => !v.locked);
      const allLocked = prev.length > 0 && prev.every((v) => v.locked);
  
      if (!allLocked && !(active && isVehicleValid(active))) {
        if (active) setTouchedIds((t) => new Set([...t, active.id]));
        return prev;
      }
  
      setTouchedIds(new Set());
      const newId = prev.reduce((max, v) => Math.max(max, v.id), 0) + 1;
  
      return [
        ...prev.map((v) => (v.locked ? v : { ...v, locked: true, editingExisting: false })),
        {
          id: newId,
          locked: false,
          editingExisting: false,
          name: "",
          startLocation: "",
          cachedLocation: undefined,
          type: "",
          capacityUnit: "",
          capacity: 0,
          available: true,
          departureTime: "",
        },
      ];
    });
  }, []);

  const addVehicleWithDetails = useCallback(
    (details: Pick<VehicleRow, "name" | "type" | "capacity" | "capacityUnit" | "available" | "departureTime">) => {
      setVehicles((prev) => {
        const newId = prev.reduce((max, v) => Math.max(max, v.id), 0) + 1;
        return [
          ...prev.map((v) => ({ ...v, locked: true })),
          {
            id: newId,
            locked: true,
            editingExisting: false,
            name: details.name,
            startLocation: "",
            cachedLocation: undefined,
            type: details.type,
            capacityUnit: details.capacityUnit,
            capacity: details.capacity,
            available: details.available,
            departureTime: details.departureTime,
          },
        ];
      });
      setTouchedIds(new Set());
    },
    []
  );

  const deleteVehicle = useCallback((id: number) => {
    setVehicles((prev) => {
      return prev.filter((v) => v.id !== id);
    });
    setTouchedIds((t) => {
      const next = new Set(t);
      next.delete(id);
      return next;
    });
  }, []);

  const markAllAvailable = useCallback(() => {
    setVehicles((prev) => prev.map((v) => ({ ...v, available: true })));
  }, []);

  const importVehicles = useCallback((incoming: VehicleRow[]) => {
    if (incoming.length === 0) return;
    setVehicles(incoming);
    setTouchedIds(new Set());
  }, []);

  const cacheVehicleLocation = useCallback((id: number, lat: number, lng: number, state?: string | null) => {
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, cachedLocation: { lat, lng, state } } : vehicle
      )
    );
  }, []);

  return {
    vehicles,
    updateVehicle,
    addVehicle,
    addVehicleWithDetails,
    deleteVehicle,
    markAllAvailable,
    importVehicles,
    touchedIds,
    activeVehicleIsValid,
    allVehiclesLocked,
    cacheVehicleLocation,
  };
}
