// app/edit/page.tsx
"use client";

/**
 * Delivery edit screen: wires vehicle and address state into sections and pagination.
 */

import styles from "@/app/edit/edit.module.css";
import Navbar from "@/app/components/navbar/Navbar";
import MobileNavbar from "@/app/components/navbar/MobileNavbar";
import MobileSidebar from "@/app/components/sidebar/MobileSidebar";
import OptimizingModal from "@/app/edit/components/shared/OptimizingModal";
import ErrorOverlay from "@/app/edit/components/shared/ErrorOverlay";
import Sidebar from "@/app/components/sidebar/Sidebar";
import SidebarEditButton from "@/app/components/sidebar/SidebarEditButton";
import SidebarResultsButton from "@/app/components/sidebar/SidebarResultsButton";
import {
  PAGE_V2_ROOT,
  PAGE_V2_BODY,
  PAGE_V2_MAIN_OUTER,
  PAGE_V2_MAIN,
  ADDRESS_SECTION_WITH_PAGINATION,
  MANAGE_VEHICLE_GROUP,
} from "@/app/edit/formStyles.v2";
import VehicleSection from "@/app/edit/components/vehicle/VehicleSection";
import ManageSectionHeader from "@/app/edit/components/shared/ManageSectionHeader";
import AddressSection from "@/app/edit/components/address/AddressSection";
import AddressPagination from "@/app/edit/components/address/AddressPagination";
import AddressPaginationMobile from "@/app/edit/components/address/AddressPaginationMobile";
import EditPageFooter from "@/app/edit/components/footer/EditPageFooter";
import MobileEditPageFooter from "@/app/edit/components/footer/MobileEditPageFooter";
import MobileBottomBar from "@/app/components/navbar/MobileBottomBar";
import { CSVImportModal } from "@/app/edit/components/address/CSVImportModal";
import CSVUploadOverlay from "@/app/edit/components/address/CSVUploadOverlay";
import DragDropOverlay from "@/app/edit/components/shared/DragDropOverlay";
import { useVehicles } from "@/app/edit/hooks/useVehicles";
import { useAddresses } from "@/app/edit/hooks/useAddresses";
import { useOptimize } from "@/app/edit/hooks/useOptimize";
import { useCSVImport } from "@/app/edit/hooks/useCSVImport";
import { useCallback, useEffect, useState } from "react";
import type { AddressCard } from "@/app/edit/types/delivery";
import { loadSessionFromFile } from "@/lib/session/importSession";
import { downloadSessionSave } from "@/lib/session/exportSession";
import {
  mapEditStateToOptimizeRequest,
  mapOptimizeRequestToEditState,
} from "@/app/edit/utils/sessionMapper";
import AddressOverlay, {
  type LocationAddress,
} from "@/app/edit/components/address/AddressOverlay";

type StoredUploadFile = { name: string; content: string };

export default function Page() {
  const vehicleState = useVehicles();
  const addressState = useAddresses();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragCount, setDragCount] = useState(0);
  const [pendingDropFile, setPendingDropFile] = useState<File | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { importVehicles } = vehicleState;
  const { importAddresses } = addressState;

  const {
    optimize,
    isOptimizing,
    optimizeError,
    clearOptimizeError,
    needsDepotAddress,
    dismissDepotAddressPrompt,
    geocodeFailedAddressIds,
    geocodeFailedVehicleIds,
    outOfRegionAddressIds,
    outOfRegionVehicleIds,
  } = useOptimize(
    vehicleState.vehicles,
    addressState.addresses,
    vehicleState.cacheVehicleLocation,
    addressState.cacheAddressLocation,
  );

  const {
    csvData,
    isImportModalOpen,
    parseError,
    openImportModal,
    closeImportModal,
  } = useCSVImport();

  const [isUploadOverlayOpen, setIsUploadOverlayOpen] = useState(false);

  const isDraggingOverPage =
    dragCount > 0 && !isUploadOverlayOpen && !isImportModalOpen;

  useEffect(() => {
    if (isImportModalOpen || parseError) setIsUploadOverlayOpen(false);
  }, [isImportModalOpen, parseError]);

  useEffect(() => {
    let cancelled = false;

    const hydrateImportedState = async () => {
      // Session save file (JSON with vehicles + deliveries schema).
      // removeItem is intentionally inside the try block — if loadSessionFromFile
      // throws, the key stays in sessionStorage so a page refresh can retry.
      const storedSavePointFile = sessionStorage.getItem("savePointFile");
      if (storedSavePointFile) {
        try {
          const savedFile = parseStoredUploadFile(
            storedSavePointFile,
            "save point",
          );
          const session = await loadSessionFromFile(
            new File([savedFile.content], savedFile.name, {
              type: "application/json",
            }),
          );
          const importedState = mapOptimizeRequestToEditState(session);
          if (cancelled) return;
          importVehicles(importedState.vehicles);
          importAddresses(importedState.addresses);
          // Only remove after a successful import so a refresh can retry on failure
          sessionStorage.removeItem("savePointFile");
        } catch (error) {
          if (!cancelled) {
            setSessionError(
              error instanceof Error
                ? error.message
                : "Failed to import the saved session.",
            );
          }
        }
        return;
      }

      // Fully-built AddressCard[] written by CSVImportModal's onConfirmAndNavigate path.
      // No parsing needed — import directly into address state.
      const storedImportedCards = sessionStorage.getItem("importedCards");
      if (storedImportedCards) {
        sessionStorage.removeItem("importedCards");
        try {
          const cards = JSON.parse(storedImportedCards) as AddressCard[];
          if (!cancelled) importAddresses(reindexAddresses(cards));
        } catch {
          if (!cancelled)
            setSessionError("Failed to import the selected entries.");
        }
        return;
      }
    };

    void hydrateImportedState();

    return () => {
      cancelled = true;
    };
  }, [importAddresses, importVehicles]);

  const handleExportSession = useCallback(async () => {
    setSessionError(null);
    try {
      const request = await mapEditStateToOptimizeRequest(
        vehicleState.vehicles,
        addressState.addresses,
      );
      const result = downloadSessionSave(request);
      if (!result.ok) throw result.error;
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Failed to export the session state.",
      );
    }
  }, [addressState.addresses, vehicleState.vehicles]);

  const clearSessionError = useCallback(() => setSessionError(null), []);

  const handleStartLocationSave = useCallback(
    (addr: LocationAddress) => {
      const parts = [addr.line1];
      if (addr.line2.trim()) parts.push(addr.line2);
      parts.push(addr.city, `${addr.state} ${addr.zipCode}`, addr.country);
      const formattedAddress = parts.join(", ");
      void optimize(formattedAddress);
    },
    [optimize],
  );

  useEffect(() => {
    if (!isUploadOverlayOpen) setPendingDropFile(null);
  }, [isUploadOverlayOpen]);

  function handlePageDragEnter(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragCount((c) => c + 1);
  }

  function handlePageDragLeave(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragCount((c) => Math.max(0, c - 1));
  }

  function handlePageDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }

  function handlePageDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragCount(0);
    const file = e.dataTransfer.files[0] ?? null;
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".csv")) {
      setPendingDropFile(file);
      setIsUploadOverlayOpen(true);
    } else {
      setUploadError(
        "This file type is not accepted. Please upload a CSV file.",
      );
    }
  }

  return (
    <div className={`${PAGE_V2_ROOT} ${styles.root}`}>
      {isUploadOverlayOpen && (
        <CSVUploadOverlay
          onClose={() => setIsUploadOverlayOpen(false)}
          onFileSelect={openImportModal}
          onInvalidFile={() => {
            setIsUploadOverlayOpen(false);
            setUploadError(
              "This file type is not accepted. Please upload a CSV file.",
            );
          }}
          initialFile={pendingDropFile ?? undefined}
        />
      )}

      {/* In-page import modal — stays on edit page after confirm */}
      {isImportModalOpen && (
        <CSVImportModal
          csvData={csvData}
          onClose={closeImportModal}
          importAddresses={(cards: AddressCard[]) =>
            addressState.importAddresses(reindexAddresses(cards))
          }
        />
      )}

      <ErrorOverlay message={optimizeError} onClose={clearOptimizeError} />
      <ErrorOverlay message={parseError} onClose={closeImportModal} />
      <ErrorOverlay message={sessionError} onClose={clearSessionError} />
      <ErrorOverlay
        message={uploadError}
        onClose={() => setUploadError(null)}
      />
      <OptimizingModal isOpen={isOptimizing} />
      {needsDepotAddress && (
        <AddressOverlay
          heading="Enter starting location for all driver routes"
          onClose={dismissDepotAddressPrompt}
          onSave={handleStartLocationSave}
        />
      )}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <MobileBottomBar
        onSave={handleExportSession}
        onOptimize={() => void optimize()}
        isOptimizing={isOptimizing}
      />
      <MobileNavbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <Navbar onSave={handleExportSession} />
      <div className={PAGE_V2_BODY}>
        <Sidebar>
          <SidebarEditButton />
          <SidebarResultsButton />
        </Sidebar>
        <div className={PAGE_V2_MAIN_OUTER}>
          {isDraggingOverPage && <DragDropOverlay />}
          <main
            className={PAGE_V2_MAIN}
            onDragEnter={handlePageDragEnter}
            onDragLeave={handlePageDragLeave}
            onDragOver={handlePageDragOver}
            onDrop={handlePageDrop}
          >
            <div className={MANAGE_VEHICLE_GROUP}>
              <ManageSectionHeader
                onOptimize={() => void optimize()}
                isOptimizing={isOptimizing}
              />
              <VehicleSection
                {...vehicleState}
                geocodeFailedVehicleIds={geocodeFailedVehicleIds}
                outOfRegionVehicleIds={outOfRegionVehicleIds}
              />
            </div>
            <div className={ADDRESS_SECTION_WITH_PAGINATION}>
              <AddressSection
                {...addressState}
                geocodeFailedIds={geocodeFailedAddressIds}
                outOfRegionIds={outOfRegionAddressIds}
                onOpenUploadOverlay={() => setIsUploadOverlayOpen(true)}
              />
              <AddressPagination {...addressState} />
              <AddressPaginationMobile {...addressState} />
            </div>
            <EditPageFooter />
            <MobileEditPageFooter />
          </main>
        </div>
      </div>
    </div>
  );
}

function parseStoredUploadFile(
  rawValue: string,
  label: string,
): StoredUploadFile {
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

function reindexAddresses(addresses: AddressCard[]): AddressCard[] {
  return addresses.map((address, index) => ({
    ...address,
    id: index + 1,
  }));
}
