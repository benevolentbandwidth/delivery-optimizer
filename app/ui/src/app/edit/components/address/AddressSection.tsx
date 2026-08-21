"use client";

/**
 * Addresses region: toolbar (find / add / import) and a stacked list of delivery cards for the current page.
 */

import { useState } from "react";
import AddressCard from "@/app/edit/components/address/AddressCard";
import ConfirmDeletionOverlay from "@/app/edit/components/shared/ConfirmDeletionOverlay";
import AddressEmptyState from "@/app/edit/components/address/AddressEmptyState";
import AddressRowHeader from "@/app/edit/components/address/AddressRowHeader";
import type { AddressCard as AddressCardType } from "@/app/edit/types/delivery";
import AddressSearchBar from "@/app/edit/components/address/AddressSearchBar";
import {
  ADDRESS_SECTION_HEADER,
  ADDRESS_SECTION_HEADING,
  ADDRESS_SECTION_SUBHEADING,
  ADDRESS_BTN_V2_DESKTOP_ENABLED,
  ADDRESS_BTN_V2_DESKTOP_DISABLED,
  ADDRESS_LIST_RESPONSIVE_CONTAINER,
  ADDRESS_LIST_RESPONSIVE_CONTAINER_DESKTOP_ONLY,
  ADDRESS_LIST_RESPONSIVE_INNER,
  ADDRESS_LIST_DESKTOP_DIVIDER,
  ADDRESS_SEARCH_DESKTOP_SIZE,
  ADDRESS_SEARCH_NO_RESULTS,
  ADDRESS_TOOLBAR_DESKTOP,
  ADDRESS_TOOLBAR_SPACER,
  MOBILE_EMPTY_STATE_CONTAINER,
  MOBILE_ADDR_TOOLBAR_ROOT,
  MOBILE_ADDR_TOOLBAR_BTN_ROW,
  MOBILE_ADDR_TOOLBAR_BTN_ENABLED,
  MOBILE_ADDR_TOOLBAR_BTN_DISABLED,
} from "@/app/edit/formStyles.v2";

type AddressSectionProps = {
  addressesOnCurrentPage: AddressCardType[];
  addressesCount: number;
  addAddress: () => void;
  updateAddress: <K extends keyof AddressCardType>(
    id: number,
    key: K,
    value: AddressCardType[K],
  ) => void;
  deleteAddress: (id: number) => void;
  unlockAddress: (id: number) => void;
  confirmAddress: (id: number) => void;
  touchedIds: Set<number>;
  allAddressesLocked: boolean;
  activeAddressIsValid: boolean;
  geocodeFailedIds: number[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  outOfRegionIds: number[];
  optimizedIds: number[];
  onOpenUploadOverlay: () => void;
};

export default function AddressSection({
  addressesOnCurrentPage,
  addressesCount,
  addAddress,
  updateAddress,
  deleteAddress,
  unlockAddress,
  confirmAddress,
  touchedIds,
  allAddressesLocked,
  activeAddressIsValid,
  geocodeFailedIds,
  searchQuery,
  setSearchQuery,
  outOfRegionIds,
  optimizedIds,
  onOpenUploadOverlay,
}: AddressSectionProps) {
  const [addressToDeleteId, setAddressToDeleteId] = useState<number | null>(
    null,
  );
  const addEnabled =
    addressesCount === 0 || allAddressesLocked || activeAddressIsValid;

  function handleDeleteRequest(id: number) {
    setAddressToDeleteId(id);
  }

  return (
    <section>
      <div className={ADDRESS_SECTION_HEADER}>
        <h2 className={ADDRESS_SECTION_HEADING}>Delivery addresses</h2>
        <p className={ADDRESS_SECTION_SUBHEADING}>
          Upload or manually add addresses
        </p>
      </div>

      {/* Mobile: Search top, buttons right-aligned side-by-side (Figma 8325:7503) */}
      <div className={MOBILE_ADDR_TOOLBAR_ROOT}>
        <AddressSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          variant="compact"
        />
        <div className={MOBILE_ADDR_TOOLBAR_BTN_ROW}>
          <button
            type="button"
            onClick={onOpenUploadOverlay}
            className={MOBILE_ADDR_TOOLBAR_BTN_ENABLED}
          >
            Import
          </button>
          <button
            type="button"
            disabled={!addEnabled}
            onClick={addAddress}
            className={
              addEnabled
                ? MOBILE_ADDR_TOOLBAR_BTN_ENABLED
                : MOBILE_ADDR_TOOLBAR_BTN_DISABLED
            }
          >
            New address
          </button>
        </div>
      </div>

      {/* Desktop: Search left, spacer, Add right */}
      <div className={ADDRESS_TOOLBAR_DESKTOP}>
        <AddressSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          className={ADDRESS_SEARCH_DESKTOP_SIZE}
          variant="desktop"
        />
        <div className={ADDRESS_TOOLBAR_SPACER} />
        <button
          type="button"
          onClick={onOpenUploadOverlay}
          className={ADDRESS_BTN_V2_DESKTOP_ENABLED}
        >
          Import
        </button>
        <button
          type="button"
          disabled={!addEnabled}
          onClick={addAddress}
          className={
            addEnabled
              ? ADDRESS_BTN_V2_DESKTOP_ENABLED
              : ADDRESS_BTN_V2_DESKTOP_DISABLED
          }
        >
          Add address
        </button>
      </div>

      {/* Mobile: bordered empty state */}
      {addressesCount === 0 && (
        <div className={MOBILE_EMPTY_STATE_CONTAINER}>
          <AddressEmptyState />
        </div>
      )}

      {/* Shared address cards. AddressCard owns its desktop/mobile layouts. */}
      {addressesCount > 0 && (
        <div className={ADDRESS_LIST_RESPONSIVE_CONTAINER}>
          <div className={ADDRESS_LIST_RESPONSIVE_INNER}>
            <AddressRowHeader />
            <div className={ADDRESS_LIST_DESKTOP_DIVIDER} />

            {searchQuery.trim() !== "" &&
            addressesOnCurrentPage.length === 0 ? (
              <div className={ADDRESS_SEARCH_NO_RESULTS}>
                No Addresses Found
              </div>
            ) : (
              addressesOnCurrentPage.map((a) => (
                <AddressCard
                  key={`address-${a.id}`}
                  address={a}
                  updateAddress={updateAddress}
                  deleteAddress={handleDeleteRequest}
                  unlockAddress={unlockAddress}
                  confirmAddress={confirmAddress}
                  addressTouched={touchedIds.has(a.id)}
                  geocodeFailed={geocodeFailedIds.includes(a.id)}
                  outOfRegionFailed={outOfRegionIds.includes(a.id)}
                  isOptimized={a.locked && optimizedIds.includes(a.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Desktop empty state keeps the hi-fi table chrome when no rows exist. */}
      {addressesCount === 0 && (
        <div className={ADDRESS_LIST_RESPONSIVE_CONTAINER_DESKTOP_ONLY}>
          <div className={ADDRESS_LIST_RESPONSIVE_INNER}>
            <AddressRowHeader />
            <div className={ADDRESS_LIST_DESKTOP_DIVIDER} />
            <AddressEmptyState />
          </div>
        </div>
      )}

      {addressToDeleteId !== null && (
        <ConfirmDeletionOverlay
          title="Delete delivery address?"
          description="Are you sure you want to delete this delivery address? This action cannot be undone."
          onClose={() => setAddressToDeleteId(null)}
          onConfirm={() => {
            deleteAddress(addressToDeleteId);
            setAddressToDeleteId(null);
          }}
        />
      )}
    </section>
  );
}
