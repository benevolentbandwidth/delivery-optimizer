// app/edit/page.tsx
"use client";

/**
 * Delivery edit screen: wires vehicle and address state into sections and pagination.
 */

import Navbar from "./components/Navbar";
import OptimizingModal from "./components/OptimizingModal";
import VehicleSection from "./components/VehicleSection";
import AddressSection from "./components/AddressSection";
import AddressPagination from "./components/AddressPagination";
import { useVehicles } from "./hooks/useVehicles";
import { useAddresses } from "./hooks/useAddresses";
import { useOptimize } from "./hooks/useOptimize";
import { parseAddressUpload, useCSVUpload } from "./hooks/useCSVUpload";
import { useCallback, useEffect, useState } from "react";
import type { AddressCard } from "./types/delivery";
import { loadSessionFromFile } from "@/lib/session/importSession";
import { downloadSessionSave } from "@/lib/session/exportSession";
import {
  mapEditStateToOptimizeRequest,
  mapOptimizeRequestToEditState,
} from "./utils/sessionMapper";
import { useRouter } from "next/navigation";

type StoredUploadFile = {
  name: string;
  content: string;
};

export default function Page() {
  const router = useRouter();
  const vehicleState = useVehicles();
  const addressState = useAddresses();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const {
    optimize,
    isOptimizing,
    optimizeError,
    clearOptimizeError,
    geocodeFailedAddressIds,
    geocodeFailedVehicleIds,
    outOfRegionAddressIds,
    outOfRegionVehicleIds,
  } = useOptimize(
    vehicleState.vehicles,
    addressState.addresses,
    vehicleState.cacheVehicleLocation,
    addressState.cacheAddressLocation
  );

  const { handleCSVUpload, csvError, clearCsvError } = useCSVUpload({
    importAddresses: addressState.importAddresses,
  });

  useEffect(() => {
    let cancelled = false;

    const hydrateImportedState = async () => {
      const storedSavePointFile = sessionStorage.getItem("savePointFile");
      if (storedSavePointFile) {
        try {
          const savedFile = parseStoredUploadFile(storedSavePointFile, "save point");
          const session = await loadSessionFromFile(
            new File([savedFile.content], savedFile.name, {
              type: "application/json",
            }),
          );
          const importedState = mapOptimizeRequestToEditState(session);

          if (cancelled) return;

          vehicleState.importVehicles(importedState.vehicles);
          addressState.importAddresses(importedState.addresses);
          sessionStorage.removeItem("savePointFile");
          return;
        } catch (error) {
          if (!cancelled) {
            setSessionError(
              error instanceof Error
                ? error.message
                : "Failed to import the saved session.",
            );
          }
          return;
        }
      }

      const storedAddressFiles = sessionStorage.getItem("addressFiles");
      if (!storedAddressFiles) return;

      try {
        const uploads = parseStoredAddressFiles(storedAddressFiles);
        const importedAddresses: AddressCard[] = [];

        for (const upload of uploads) {
          importedAddresses.push(
            ...(await parseAddressUpload(upload.name, upload.content)),
          );
        }

        if (cancelled) return;

        addressState.importAddresses(reindexAddresses(importedAddresses));
        sessionStorage.removeItem("addressFiles");
      } catch (error) {
        if (!cancelled) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Failed to import the uploaded addresses.",
          );
        }
      }
    };

    void hydrateImportedState();

    return () => {
      cancelled = true;
    };
  }, [
    addressState.importAddresses,
    vehicleState.importVehicles,
  ]);

  const handleImportSession = useCallback(() => {
    router.push("/welcome");
  }, [router]);

  const handleExportSession = useCallback(async () => {
    setSessionError(null);

    try {
      const request = await mapEditStateToOptimizeRequest(
        vehicleState.vehicles,
        addressState.addresses
      );
      const result = downloadSessionSave(request);

      if (!result.ok) {
        throw result.error;
      }
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Failed to export the session state."
      );
    }
  }, [addressState.addresses, vehicleState.vehicles]);

  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans-manrope">
      <OptimizingModal isOpen={isOptimizing} />
      <Navbar
        onImportSession={handleImportSession}
        onExportSession={handleExportSession}
        onOptimize={optimize}
        isOptimizing={isOptimizing}
        error={sessionError ?? optimizeError ?? csvError}
        onClearError={() => { clearSessionError(); clearOptimizeError(); clearCsvError(); }}
      />
      <main className="px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-8 md:space-y-10 max-w-[1480px] mx-auto">
        <VehicleSection {...vehicleState} geocodeFailedVehicleIds={geocodeFailedVehicleIds} outOfRegionVehicleIds={outOfRegionVehicleIds} />
        <AddressSection {...addressState} geocodeFailedIds={geocodeFailedAddressIds} outOfRegionIds={outOfRegionAddressIds} onCSVUpload={handleCSVUpload} />
        <AddressPagination {...addressState} />
      </main>
    </div>
  );
}

function parseStoredUploadFile(rawValue: string, label: string): StoredUploadFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error(`Invalid ${label} upload payload.`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as StoredUploadFile).name !== "string" ||
    typeof (parsed as StoredUploadFile).content !== "string"
  ) {
    throw new Error(`Invalid ${label} upload payload.`);
  }

  return parsed as StoredUploadFile;
}

function parseStoredAddressFiles(rawValue: string): StoredUploadFile[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("Invalid address upload payload.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid address upload payload.");
  }

  return parsed.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as StoredUploadFile).name !== "string" ||
      typeof (entry as StoredUploadFile).content !== "string"
    ) {
      throw new Error("Invalid address upload payload.");
    }

    return entry as StoredUploadFile;
  });
}

function reindexAddresses(addresses: ReturnType<typeof mapOptimizeRequestToEditState>["addresses"]) {
  return addresses.map((address, index) => ({
    ...address,
    id: index + 1,
  }));
}
