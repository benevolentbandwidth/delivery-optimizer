/**
 * Orchestrates the optimize flow: validate, geocode, submit an optimization
 * job, poll status, then fetch the completed result.
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { geocodeAddress } from "@/app/components/AddressGeocoder/utils/nominatim";

import {
  addressCardToDeliveryInput,
  vehicleRowToVehicleInput,
} from "@/app/edit/utils/optimizeMapper";
import { SUPPORTED_STATES } from "@/app/edit/constants/supportedRegions";
import { hasCachedLocationWithState } from "@/app/edit/utils/deliveryHelpers";
import { setOptimizeResults } from "@/app/edit/utils/hasOptimizeResults";
import { vroomToRoutes } from "@/app/edit/utils/vroomToRoutes";
import {
  capacityWarningMessage,
  nextPartialApproval,
  shouldWarnForOverCapacity,
  type PartialApprovalEvent,
} from "@/app/edit/lib/partialOptimizationApproval";
import { saveEditPageDraft } from "@/lib/session/editPageDraft";
import type {
  AddressCard,
  CapacityUnit,
  LockedVehicleRow,
  VehicleRow,
} from "@/app/edit/types/delivery";
import type { VroomResponse } from "@/app/edit/types/vroomResponse";

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 120000;

type OptimizationJobState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "expired";

type OptimizationJobStatusResponse = {
  job_id: string;
  status: OptimizationJobState;
  error?: string;
};

type PreflightResult =
  | { ok: false }
  | {
      ok: true;
      availableVehicles: VehicleRow[];
      lockedVehicles: LockedVehicleRow[];
      demandType: CapacityUnit;
      totalDemand: number;
      totalCapacity: number;
    };

function isLocked(v: VehicleRow): v is LockedVehicleRow {
  return v.locked && v.type !== "" && v.capacityUnit !== "";
}

function isOptimizationJobStatusResponse(
  value: unknown,
): value is OptimizationJobStatusResponse {
  return Boolean(
    value &&
    typeof value === "object" &&
    "job_id" in value &&
    typeof (value as { job_id?: unknown }).job_id === "string" &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "string",
  );
}

function readErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }

  return fallback;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useOptimize(
  vehicles: VehicleRow[],
  addresses: AddressCard[],
  setVehiclesStartLocation: (
    ids: number[],
    startLocation: string,
    location: { lat: number; lng: number; state?: string | null },
  ) => void,
  cacheAddressLocation: (
    id: number,
    lat: number,
    lng: number,
    state?: string | null,
  ) => void,
) {
  const router = useRouter();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [geocodeFailedAddressIds, setGeocodeFailedAddressIds] = useState<
    number[]
  >([]);
  const [geocodeFailedVehicleIds, setGeocodeFailedVehicleIds] = useState<
    number[]
  >([]);
  const [outOfRegionAddressIds, setOutOfRegionAddressIds] = useState<number[]>(
    [],
  );
  const [outOfRegionVehicleIds, setOutOfRegionVehicleIds] = useState<number[]>(
    [],
  );
  const [optimizationJobId, setOptimizationJobId] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<unknown>(null);
  const [needsDepotAddress, setNeedsDepotAddress] = useState(false);
  const allowPartialRef = useRef(false);
  const optimizeInFlightRef = useRef(false);

  const setPartialApproval = useCallback((event: PartialApprovalEvent) => {
    allowPartialRef.current = nextPartialApproval(
      allowPartialRef.current,
      event,
    );
  }, []);

  const clearTransientOptimizeState = useCallback(() => {
    setOptimizeError(null);
    setCapacityWarning(null);
    setGeocodeFailedAddressIds([]);
    setGeocodeFailedVehicleIds([]);
    setOutOfRegionAddressIds([]);
    setOutOfRegionVehicleIds([]);
    setOptimizationJobId(null);
    setResult(null);
  }, []);

  const runPreflight = useCallback(
    (setError: (message: string) => void): PreflightResult => {
      const unlockedVehicle = vehicles.find((v) => !v.locked);
      const unlockedAddress = addresses.find((a) => !a.locked);
      if (unlockedVehicle || unlockedAddress) {
        setError(
          "Please confirm all vehicles and addresses before optimizing.",
        );
        return { ok: false };
      }

      const availableVehicles = vehicles.filter((v) => v.available);
      if (availableVehicles.length === 0) {
        setError("At least one available vehicle is required.");
        return { ok: false };
      }
      if (addresses.length === 0) {
        setError("At least one delivery address is required.");
        return { ok: false };
      }

      const lockedVehicles = availableVehicles.filter(isLocked);
      if (lockedVehicles.length !== availableVehicles.length) {
        setError("One or more vehicles are missing type or capacity unit.");
        return { ok: false };
      }

      const units = [...new Set(availableVehicles.map((v) => v.capacityUnit))];
      if (units.length > 1) {
        setError("All vehicles must use the same capacity unit to optimize.");
        return { ok: false };
      }
      const demandType = units[0] as CapacityUnit;

      const totalDemand = addresses.reduce(
        (sum, a) => sum + a.deliveryQuantity,
        0,
      );
      const totalCapacity = availableVehicles.reduce(
        (sum, v) => sum + v.capacity,
        0,
      );

      return {
        ok: true,
        availableVehicles,
        lockedVehicles,
        demandType,
        totalDemand,
        totalCapacity,
      };
    },
    [vehicles, addresses],
  );

  const startOptimize = useCallback(() => {
    setPartialApproval("fresh_start");
    clearTransientOptimizeState();
    setNeedsDepotAddress(false);

    const preflight = runPreflight(setOptimizeError);
    if (!preflight.ok) return;

    if (
      shouldWarnForOverCapacity(
        preflight.totalDemand,
        preflight.totalCapacity,
        allowPartialRef.current,
      )
    ) {
      setCapacityWarning(
        capacityWarningMessage(preflight.totalDemand, preflight.totalCapacity),
      );
      return;
    }

    setNeedsDepotAddress(true);
  }, [clearTransientOptimizeState, runPreflight, setPartialApproval]);

  const optimizeAnyway = useCallback(() => {
    setPartialApproval("approve");
    setCapacityWarning(null);
    setNeedsDepotAddress(true);
  }, [setPartialApproval]);

  const optimize = useCallback(
    async (depotAddress: string) => {
      if (optimizeInFlightRef.current || isOptimizing) return;

      clearTransientOptimizeState();
      setNeedsDepotAddress(false);

      const preflight = runPreflight(setOptimizeError);
      if (!preflight.ok) {
        setPartialApproval("run_finished");
        return;
      }

      if (
        shouldWarnForOverCapacity(
          preflight.totalDemand,
          preflight.totalCapacity,
          allowPartialRef.current,
        )
      ) {
        setCapacityWarning(
          capacityWarningMessage(
            preflight.totalDemand,
            preflight.totalCapacity,
          ),
        );
        return;
      }

      const trimmedDepotAddress = depotAddress.trim();
      if (!trimmedDepotAddress) {
        setNeedsDepotAddress(true);
        return;
      }

      const { availableVehicles, lockedVehicles, demandType } = preflight;

      optimizeInFlightRef.current = true;
      setIsOptimizing(true);
      try {
        // Geocode the shared depot address once and reuse it for all vehicles.
        const depotLoc = await geocodeAddress(trimmedDepotAddress);
        if (!depotLoc) {
          setGeocodeFailedVehicleIds(availableVehicles.map((v) => v.id));
          setOptimizeError(
            `Could not geocode starting address "${trimmedDepotAddress}". Try a more specific address.`,
          );
          return;
        }
        const depotVehicleIds = availableVehicles.map((v) => v.id);
        setVehiclesStartLocation(
          depotVehicleIds,
          trimmedDepotAddress,
          depotLoc,
        );
        const depotVehicleIdSet = new Set(depotVehicleIds);
        const vehiclesWithDepotLocation = vehicles.map((vehicle) =>
          depotVehicleIdSet.has(vehicle.id)
            ? {
                ...vehicle,
                startLocation: trimmedDepotAddress,
                cachedLocation: {
                  lat: depotLoc.lat,
                  lng: depotLoc.lng,
                  state: depotLoc.state ?? null,
                },
              }
            : vehicle,
        );
        saveEditPageDraft(vehiclesWithDepotLocation, addresses);
        const vehicleLocations: Map<
          number,
          { lat: number; lng: number; state: string | null }
        > = new Map(availableVehicles.map((v) => [v.id, depotLoc]));

        const addressLocations: Map<
          number,
          { lat: number; lng: number; state: string | null }
        > = new Map();
        const failedAddresses: { id: number; address: string }[] = [];
        for (const a of addresses) {
          const loc = hasCachedLocationWithState(a)
            ? {
                lat: a.cachedLocation!.lat,
                lng: a.cachedLocation!.lng,
                state: a.cachedLocation!.state!,
              }
            : await geocodeAddress(a.recipientAddress);
          if (!loc) {
            failedAddresses.push({ id: a.id, address: a.recipientAddress });
          } else {
            addressLocations.set(a.id, loc);
            cacheAddressLocation(a.id, loc.lat, loc.lng, loc.state);
          }
        }

        if (failedAddresses.length > 0) {
          setGeocodeFailedAddressIds(failedAddresses.map((f) => f.id));
          const shown = failedAddresses
            .slice(0, 3)
            .map((f) => `"${f.address}"`);
          const overflow = failedAddresses.length - shown.length;
          const suffix = overflow > 0 ? `, and ${overflow} more` : "";
          setOptimizeError(
            `Could not geocode: ${shown.join(", ")}${suffix}. Try more specific addresses.`,
          );
          return;
        }

        if (!depotLoc.state || !SUPPORTED_STATES.has(depotLoc.state)) {
          setOutOfRegionVehicleIds(availableVehicles.map((v) => v.id));
          setOptimizeError(
            `Unsupported region: "${trimmedDepotAddress}". We currently only support CA, TX, and FL.`,
          );
          return;
        }

        const badDeliveryAddresses: { id: number; address: string }[] = [];
        for (const [id, loc] of addressLocations) {
          if (!loc.state || !SUPPORTED_STATES.has(loc.state)) {
            const address = addresses.find((candidate) => candidate.id === id);
            if (address) {
              badDeliveryAddresses.push({
                id,
                address: address.recipientAddress,
              });
            }
          }
        }

        if (badDeliveryAddresses.length > 0) {
          setOutOfRegionAddressIds(badDeliveryAddresses.map((f) => f.id));
          const shown = badDeliveryAddresses
            .slice(0, 3)
            .map((f) => `"${f.address}"`);
          const overflow = badDeliveryAddresses.length - shown.length;
          const suffix = overflow > 0 ? `, and ${overflow} more` : "";
          setOptimizeError(
            `Unsupported region(s): ${shown.join(", ")}${suffix}. We currently only support CA, TX, and FL.`,
          );
          return;
        }

        const vehicleInputs = lockedVehicles.map((v) =>
          vehicleRowToVehicleInput(v, vehicleLocations.get(v.id)!),
        );
        const deliveryInputs = addresses.map((a) =>
          addressCardToDeliveryInput(
            a,
            addressLocations.get(a.id)!,
            demandType,
          ),
        );

        const submitResponse = await fetch("/api/optimization-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicles: vehicleInputs,
            deliveries: deliveryInputs,
          }),
        });
        const submitBody = await readJsonResponse(submitResponse);
        if (!submitResponse.ok) {
          setOptimizeError(
            readErrorMessage(submitBody, "Failed to create optimization job."),
          );
          return;
        }
        if (!isOptimizationJobStatusResponse(submitBody)) {
          setOptimizeError(
            "Received invalid optimization job response from server.",
          );
          return;
        }

        setOptimizationJobId(submitBody.job_id);

        const pollDeadline = Date.now() + POLL_TIMEOUT_MS;
        while (Date.now() < pollDeadline) {
          const statusResponse = await fetch(
            `/api/optimization-jobs/${encodeURIComponent(submitBody.job_id)}`,
            { cache: "no-store" },
          );
          const statusBody = await readJsonResponse(statusResponse);
          if (!statusResponse.ok) {
            setOptimizeError(
              readErrorMessage(
                statusBody,
                "Failed to fetch optimization job status.",
              ),
            );
            return;
          }
          if (!isOptimizationJobStatusResponse(statusBody)) {
            setOptimizeError(
              "Received invalid optimization job status from server.",
            );
            return;
          }

          if (statusBody.status === "succeeded") {
            const resultResponse = await fetch(
              `/api/optimization-jobs/${encodeURIComponent(statusBody.job_id)}/result`,
              { cache: "no-store" },
            );
            const resultBody = await readJsonResponse(resultResponse);
            if (resultResponse.status === 202) {
              await sleep(POLL_INTERVAL_MS);
              continue;
            }
            if (!resultResponse.ok) {
              setOptimizeError(
                readErrorMessage(
                  resultBody,
                  "Failed to fetch optimization job result.",
                ),
              );
              return;
            }

            setResult(resultBody);
            const routes = vroomToRoutes(
              resultBody as VroomResponse,
              lockedVehicles,
              addresses,
              trimmedDepotAddress || "",
            );
            setOptimizeResults(routes);
            router.push("/results");
            return;
          }

          if (
            statusBody.status === "failed" ||
            statusBody.status === "timed_out" ||
            statusBody.status === "expired"
          ) {
            setOptimizeError(
              statusBody.error ??
                "Optimization job did not complete successfully.",
            );
            return;
          }

          await sleep(POLL_INTERVAL_MS);
        }

        setOptimizeError(
          "Optimization timed out while waiting for the completed route.",
        );
      } catch {
        setOptimizeError(
          "Network error. Please check your connection and try again.",
        );
      } finally {
        setPartialApproval("run_finished");
        optimizeInFlightRef.current = false;
        setIsOptimizing(false);
      }
    },
    [
      addresses,
      cacheAddressLocation,
      clearTransientOptimizeState,
      isOptimizing,
      router,
      runPreflight,
      setPartialApproval,
      setVehiclesStartLocation,
      vehicles,
    ],
  );

  const clearOptimizeError = useCallback(() => {
    setOptimizeError(null);
  }, []);

  const clearCapacityWarning = useCallback(() => {
    setPartialApproval("dismiss");
    setCapacityWarning(null);
  }, [setPartialApproval]);

  const dismissDepotAddressPrompt = useCallback(() => {
    setPartialApproval("dismiss");
    setNeedsDepotAddress(false);
  }, [setPartialApproval]);

  return {
    startOptimize,
    optimizeAnyway,
    optimize,
    isOptimizing,
    optimizeError,
    clearOptimizeError,
    capacityWarning,
    clearCapacityWarning,
    needsDepotAddress,
    dismissDepotAddressPrompt,
    geocodeFailedAddressIds,
    geocodeFailedVehicleIds,
    outOfRegionAddressIds,
    outOfRegionVehicleIds,
    optimizationJobId,
    result,
  };
}
