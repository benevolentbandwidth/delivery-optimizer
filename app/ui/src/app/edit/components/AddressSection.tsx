"use client";

/**
 * Addresses region: toolbar (find / add / import) and a stacked list of delivery cards for the current page.
 */

import { useRef, useState } from "react";
import AddressCard from "./AddressCard";
import ConfirmDeletionOverlay from "./ConfirmDeletionOverlay";
import AddressEmptyState from "./AddressEmptyState";
import AddressRowHeader from "./AddressRowHeader";
import type { AddressCard as AddressCardType } from "../types/delivery";
import {
  ADDRESS_EMPTY_STATE,
  ADDRESS_TOOLBAR_DESKTOP,
} from "../formStyles";

import AddressSearchBar from "./AddressSearchBar";
import {
  ADDRESS_SECTION_HEADER,
  ADDRESS_SECTION_HEADING,
  ADDRESS_SECTION_SUBHEADING,
  ADDRESS_BTN_V2_DESKTOP_ENABLED,
  ADDRESS_BTN_V2_DESKTOP_DISABLED,
  ADDRESS_LIST_CONTAINER,
  ADDRESS_LIST_CONTAINER_INNER,
  ADDRESS_LIST_DIVIDER,
  ADDRESS_SEARCH_DESKTOP_SIZE,
  ADDRESS_TOOLBAR_SPACER,
  MOBILE_EMPTY_STATE_CONTAINER,
  MOBILE_ADDR_TOOLBAR_ROOT,
  MOBILE_ADDR_TOOLBAR_BTN_ROW,
  MOBILE_ADDR_TOOLBAR_BTN_ENABLED,
  MOBILE_ADDR_TOOLBAR_BTN_DISABLED,
  ADDRESS_LIST_MOBILE_WRAP,
} from "../formStyles.v2";

type AddressSectionProps = {
  addressesOnCurrentPage: AddressCardType[];
  addressesCount: number;
  addAddress: () => void;
  updateAddress: <K extends keyof AddressCardType>(id: number, key: K, value: AddressCardType[K]) => void;
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
  onCSVUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  onCSVUpload,
}: AddressSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addressToDeleteId, setAddressToDeleteId] = useState<number | null>(null);
  const addEnabled = addressesCount === 0 || allAddressesLocked || activeAddressIsValid;

  function handleDeleteRequest(id: number) {
    setAddressToDeleteId(id);
  }

  return (
    <section>
      <div className={ADDRESS_SECTION_HEADER}>
        <h2 className={ADDRESS_SECTION_HEADING}>Delivery addresses</h2>
        <p className={ADDRESS_SECTION_SUBHEADING}>Upload or manually add addresses</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          onCSVUpload(e);
          e.target.value = "";
        }}
        className="hidden"
        aria-hidden
      />

      {/* Mobile: Search top, buttons right-aligned side-by-side (Figma 8325:7503) */}
      <div className={MOBILE_ADDR_TOOLBAR_ROOT}>
        <AddressSearchBar value={searchQuery} onChange={setSearchQuery} variant="compact" />
        <div className={MOBILE_ADDR_TOOLBAR_BTN_ROW}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={MOBILE_ADDR_TOOLBAR_BTN_ENABLED}
          >
            Import
          </button>
          <button
            type="button"
            disabled={!addEnabled}
            onClick={addAddress}
            className={addEnabled ? MOBILE_ADDR_TOOLBAR_BTN_ENABLED : MOBILE_ADDR_TOOLBAR_BTN_DISABLED}
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
          onClick={() => fileInputRef.current?.click()}
          className={ADDRESS_BTN_V2_DESKTOP_ENABLED}
        >
          Import
        </button>
        <button
          type="button"
          disabled={!addEnabled}
          onClick={addAddress}
          className={addEnabled ? ADDRESS_BTN_V2_DESKTOP_ENABLED : ADDRESS_BTN_V2_DESKTOP_DISABLED}
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

      {/* Mobile: stacked cards or no-results message */}
      {addressesCount > 0 && (
        <div className={ADDRESS_LIST_MOBILE_WRAP}>
          {searchQuery.trim() !== "" && addressesOnCurrentPage.length === 0 ? (
            <div className={ADDRESS_EMPTY_STATE}>No Addresses Found</div>
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
              />
            ))
          )}
        </div>
      )}

      {/* Desktop hi-fi container: header + divider + rows */}
      <div className={ADDRESS_LIST_CONTAINER}>
        <div className={ADDRESS_LIST_CONTAINER_INNER}>
          <AddressRowHeader />
          <div className={ADDRESS_LIST_DIVIDER} />
          {addressesCount === 0 ? (
            <AddressEmptyState />
          ) : searchQuery.trim() !== "" && addressesOnCurrentPage.length === 0 ? (
            <div className={ADDRESS_EMPTY_STATE}>No Addresses Found</div>
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
              />
            ))
          )}
        </div>
      </div>

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
