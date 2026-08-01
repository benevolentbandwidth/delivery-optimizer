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
import AlertPopup from "@/app/edit/components/shared/AlertPopup";
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
import CSVUploadOverlay from "@/app/edit/components/address/CSVUploadOverlay";
import { useCSVImport } from "@/app/edit/hooks/useCSVImport";
import DragDropOverlay from "@/app/edit/components/shared/DragDropOverlay";
import { useVehicles } from "@/app/edit/hooks/useVehicles";
import { useAddresses } from "@/app/edit/hooks/useAddresses";
import { useOptimize } from "@/app/edit/hooks/useOptimize";
import { useCallback, useEffect, useState } from "react";
import { loadSessionFromFile } from "@/lib/session/importSession";
import { downloadSessionSave } from "@/lib/session/exportSession";
import {
  saveEditPageDraft,
  loadEditPageDraft,
} from "@/lib/session/editPageDraft";
import {
  mapEditStateToSessionSave,
  mapOptimizeRequestToEditState,
} from "@/app/edit/utils/sessionMapper";
import AddressOverlay, {
  type LocationAddress,
} from "@/app/edit/components/address/AddressOverlay";
import type { AddressCard } from "@/app/edit/types/delivery";

type StoredUploadFile = { name: string; content: string };

function reindexAddresses(addresses: AddressCard[]): AddressCard[] {
  return addresses.map((address, index) => ({
    ...address,
    id: index + 1,
  }));
}

export default function Page() {
  const vehicleState = useVehicles();
  const addressState = useAddresses();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragCount, setDragCount] = useState(0);
  const [pendingDropFile, setPendingDropFile] = useState<File | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadOverlayOpen, setIsUploadOverlayOpen] = useState(false);
  const [pendingCSVFile, setPendingCSVFile] = useState<File | null>(null);
  const { importVehicles } = vehicleState;
  const { importAddresses } = addressState;
  const { parseError, closeImportModal } = useCSVImport();

  const {
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
  } = useOptimize(
    vehicleState.vehicles,
    addressState.addresses,
    vehicleState.setVehiclesStartLocation,
    addressState.cacheAddressLocation,
  );

  const [isHydrated, setIsHydrated] = useState(false);

  const isDraggingOverPage = dragCount > 0 && !isUploadOverlayOpen;

  useEffect(() => {
    if (!isUploadOverlayOpen) setPendingDropFile(null);
  }, [isUploadOverlayOpen]);

  useEffect(() => {
    let cancelled = false;

    const hydrateImportedState = async () => {
      try {
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

        // TODO: remove after one release cycle — importedCards was written by
        // CSVImportModal.handleConfirm which has since been deleted. There is
        // no reader for its format anymore, so just clear the stale key for
        // any in-flight sessions.
        if (sessionStorage.getItem("importedCards")) {
          sessionStorage.removeItem("importedCards");
        }

        // CSV/JSON file forwarded from upload-save-point — open CSVUploadOverlay
        // automatically so the user lands directly in the column mapper.
        const storedPendingCSV = sessionStorage.getItem("pendingCSVFile");
        if (storedPendingCSV) {
          sessionStorage.removeItem("pendingCSVFile");
          try {
            const { name, content } = JSON.parse(storedPendingCSV) as {
              name: string;
              content: string;
            };
            const type = name.endsWith(".json")
              ? "application/json"
              : "text/csv";
            const file = new File([content], name, { type });
            if (!cancelled) {
              setPendingCSVFile(file);
              setIsUploadOverlayOpen(true);
            }
          } catch {
            // silently ignore malformed stored file
          }
          return;
        }

        // Auto-saved draft — restore vehicles and addresses when navigating back
        // from the results page. Lower priority than all sessionStorage paths above.
        const draft = loadEditPageDraft();
        if (draft) {
          if (!cancelled) {
            if (draft.vehicles.length > 0) importVehicles(draft.vehicles);
            if (draft.addresses.length > 0) importAddresses(draft.addresses);
          }
        }
      } finally {
        // Signal that initial hydration is complete so the save effect can run.
        // Runs on every exit path (success, error, early return) except cancellation.
        if (!cancelled) setIsHydrated(true);
      }
    };

    void hydrateImportedState();

    return () => {
      cancelled = true;
    };
  }, [importAddresses, importVehicles]);

  useEffect(() => {
    if (!isHydrated) return;
    const draftSaveTimer = window.setTimeout(() => {
      saveEditPageDraft(vehicleState.vehicles, addressState.addresses);
    }, 500);
    return () => {
      window.clearTimeout(draftSaveTimer);
    };
  }, [isHydrated, vehicleState.vehicles, addressState.addresses]);

  const handleExportSession = useCallback(async () => {
    setSessionError(null);
    try {
      const session = await mapEditStateToSessionSave(
        vehicleState.vehicles,
        addressState.addresses,
      );
      const result = downloadSessionSave(session);
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
      {/* CSVUploadOverlay handles file pick, column mapping, and row selection */}
      {isUploadOverlayOpen && (
        <CSVUploadOverlay
          onClose={() => {
            setIsUploadOverlayOpen(false);
            setPendingCSVFile(null);
          }}
          importAddresses={(cards: AddressCard[]) =>
            addressState.importAddresses(
              reindexAddresses([...addressState.addresses, ...cards]),
            )
          }
          onInvalidFile={() => {
            setIsUploadOverlayOpen(false);
            setPendingCSVFile(null);
            setUploadError(
              "This file type is not accepted. Please upload a CSV file.",
            );
          }}
          initialFile={pendingDropFile ?? pendingCSVFile ?? undefined}
        />
      )}

      <AlertPopup message={optimizeError} onClose={clearOptimizeError} />
      <AlertPopup
        variant="warning"
        title="Vehicle capacity is limited"
        message={capacityWarning}
        onClose={clearCapacityWarning}
        action={{
          label: "Optimize Anyway",
          onClick: optimizeAnyway,
        }}
        actionDisabled={isOptimizing}
      />
      <AlertPopup message={sessionError} onClose={clearSessionError} />
      <AlertPopup message={uploadError} onClose={() => setUploadError(null)} />
      <AlertPopup message={parseError} onClose={closeImportModal} />
      <OptimizingModal isOpen={isOptimizing} />
      {needsDepotAddress && (
        <AddressOverlay
          heading="Enter starting location for all driver routes"
          onClose={dismissDepotAddressPrompt}
          onSave={handleStartLocationSave}
          primaryDisabled={isOptimizing}
        />
      )}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <MobileBottomBar
        onSave={handleExportSession}
        onOptimize={startOptimize}
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
                onOptimize={startOptimize}
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
