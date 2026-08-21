/**
 * Address list state: paged stops, lock/edit workflow, and validation for "add next".
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { AddressCard } from "@/app/edit/types/delivery";
import Fuse from "fuse.js";

export const ADDRESS_PAGE_SIZE_OPTIONS = [5, 10, 20, 30] as const;

export function useAddresses() {
  const [addresses, setAddresses] = useState<AddressCard[]>([]);

  // Monotonic high-water mark for address ids: never reissue an id that's
  // already appeared, even after its address is deleted (deleted addresses
  // can still be referenced by a stale optimize-results snapshot).
  const highestIdRef = useRef(0);
  useEffect(() => {
    for (const a of addresses) {
      if (a.id > highestIdRef.current) highestIdRef.current = a.id;
    }
  }, [addresses]);
  const reserveId = useCallback(() => {
    highestIdRef.current += 1;
    return highestIdRef.current;
  }, []);

  // Search: fuzzy filter across name, phone, address, and notes.
  const [searchQuery, _setSearchQuery] = useState("");

  // Fuse.js fuzzy search across recipient identity and stop details.
  const fuse = useMemo(
    () =>
      new Fuse(addresses, {
        keys: ["recipientName", "phoneNumber", "recipientAddress", "notes"],
        threshold: 0.3, // 0.0 = exact, 1.0 = match anything
        ignoreLocation: true, // don't penalize matches far from string start
      }),
    [addresses],
  );

  const filteredAddresses = useMemo(
    () =>
      searchQuery.trim() === ""
        ? addresses
        : fuse.search(searchQuery).map((result) => result.item),
    [addresses, fuse, searchQuery],
  );

  const isSearchActive = searchQuery.trim() !== "";

  // Pagination: slice the flat list so the UI only renders one page of cards.
  const [addressPage, setAddressPage] = useState(1);
  const [addressesPerPage, _setAddressesPerPage] = useState(10);

  const setAddressesPerPage = useCallback((n: number) => {
    _setAddressesPerPage(n);
    setAddressPage(1);
  }, []);

  const totalAddressPages = Math.max(
    1,
    Math.ceil(filteredAddresses.length / addressesPerPage),
  );
  const addressesOnCurrentPage = filteredAddresses.slice(
    (addressPage - 1) * addressesPerPage,
    addressPage * addressesPerPage,
  );

  const setSearchQuery = useCallback((q: string) => {
    _setSearchQuery(q);
    setAddressPage(1);
  }, []);

  // Set of address IDs whose fields should show validation errors.
  const [touchedIds, setTouchedIds] = useState<Set<number>>(new Set());

  // The single unlocked row must be complete before another "Add" is allowed.
  const activeAddress = addresses.find((a) => !a.locked);
  const activeAddressIsValid =
    !!activeAddress &&
    activeAddress.recipientAddress.trim() !== "" &&
    activeAddress.deliveryQuantity > 0;

  const allAddressesLocked =
    addresses.length > 0 && addresses.every((a) => a.locked);

  // Merge one field into the matching address by id.
  const updateAddress = useCallback(
    <K extends keyof AddressCard>(
      id: number,
      key: K,
      value: AddressCard[K],
    ) => {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                [key]: value,
                ...(key === "recipientAddress"
                  ? { cachedLocation: undefined }
                  : {}),
              }
            : a,
        ),
      );
    },
    [],
  );

  // Lock any in-progress row, append a new empty row, and jump to its page.
  const addAddress = useCallback(() => {
    if (addresses.length === 0) {
      setAddresses([
        {
          id: reserveId(),
          locked: false,
          editingExisting: false,
          recipientName: "",
          phoneNumber: "",
          recipientAddress: "",
          cachedLocation: undefined,
          timeBuffer: 0,
          deliveryTimeStart: "",
          deliveryTimeEnd: "",
          deliveryQuantity: 0,
          notes: "",
        },
      ]);
      setTouchedIds(new Set());
      setAddressPage(1);
      return;
    }

    const active = addresses.find((a) => !a.locked);
    const allLocked = addresses.every((a) => a.locked);
    const isValid =
      !!active &&
      active.recipientAddress.trim() !== "" &&
      active.deliveryQuantity > 0;

    if (!allLocked && !isValid) {
      if (active) setTouchedIds((t) => new Set([...t, active.id]));
      return;
    }

    setAddresses([
      ...addresses.map((a) =>
        a.locked ? a : { ...a, locked: true, editingExisting: false },
      ),
      {
        id: reserveId(),
        locked: false,
        editingExisting: false,
        recipientName: "",
        phoneNumber: "",
        recipientAddress: "",
        cachedLocation: undefined,
        timeBuffer: 0,
        deliveryTimeStart: "",
        deliveryTimeEnd: "",
        deliveryQuantity: 0,
        notes: "",
      },
    ]);
    setTouchedIds(new Set());
    _setSearchQuery("");
    setAddressPage(Math.ceil((addresses.length + 1) / addressesPerPage));
  }, [addresses, addressesPerPage, reserveId]);

  const deleteAddress = useCallback(
    (id: number) => {
      if (addresses.length === 0) return;
      const next = addresses.filter((a) => a.id !== id);
      const maxPage = Math.max(1, Math.ceil(next.length / addressesPerPage));
      setAddresses(next);
      setAddressPage((p) => Math.min(p, maxPage));
      setTouchedIds((t) => {
        const updated = new Set(t);
        updated.delete(id);
        return updated;
      });
    },
    [addresses, addressesPerPage],
  );

  // Re-open a saved row for editing (shows Confirm in the card).
  // If another row is currently unlocked and valid, auto-lock it first.
  // If the open row is invalid, block the switch and surface its errors.
  const unlockAddress = useCallback(
    (id: number) => {
      const activeUnlocked = addresses.find((a) => !a.locked);

      if (activeUnlocked) {
        if (activeUnlocked.id === id) return;

        const valid =
          activeUnlocked.recipientAddress.trim() !== "" &&
          activeUnlocked.deliveryQuantity > 0;

        if (!valid) {
          setTouchedIds((t) => new Set([...t, activeUnlocked.id]));
          return;
        }

        setAddresses(
          addresses.map((a) => {
            if (a.id === activeUnlocked.id)
              return { ...a, locked: true, editingExisting: false };
            if (a.id === id)
              return { ...a, locked: false, editingExisting: true };
            return a;
          }),
        );
        setTouchedIds((t) => {
          const next = new Set(t);
          next.delete(activeUnlocked.id);
          next.delete(id);
          return next;
        });
        return;
      }

      setAddresses(
        addresses.map((a) =>
          a.id === id ? { ...a, locked: false, editingExisting: true } : a,
        ),
      );
      setTouchedIds((t) => {
        const next = new Set(t);
        next.delete(id);
        return next;
      });
    },
    [addresses],
  );

  // Validate required fields, then lock the row back to read-only gray cells.
  const confirmAddress = useCallback(
    (id: number) => {
      const a = addresses.find((x) => x.id === id);
      if (!a) return;
      const valid = a.recipientAddress.trim() !== "" && a.deliveryQuantity > 0;
      if (!valid) {
        setTouchedIds((t) => new Set([...t, id]));
        return;
      }
      setAddresses(
        addresses.map((x) =>
          x.id === id ? { ...x, locked: true, editingExisting: false } : x,
        ),
      );
      setTouchedIds((t) => {
        const next = new Set(t);
        next.delete(id);
        return next;
      });
    },
    [addresses],
  );

  const importAddresses = useCallback((incoming: AddressCard[]) => {
    if (incoming.length === 0) return;
    setAddresses(incoming);
    setAddressPage(1);
    setTouchedIds(new Set());
    _setSearchQuery("");
  }, []);

  const cacheAddressLocation = useCallback(
    (id: number, lat: number, lng: number, state?: string | null) => {
      setAddresses((prev) =>
        prev.map((address) =>
          address.id === id
            ? { ...address, cachedLocation: { lat, lng, state } }
            : address,
        ),
      );
    },
    [],
  );
  return {
    addresses,
    updateAddress,
    addAddress,
    deleteAddress,
    unlockAddress,
    confirmAddress,
    importAddresses,
    reserveId,
    touchedIds,
    addressPage,
    setAddressPage,
    totalAddressPages,
    addressesOnCurrentPage,
    addressesPerPage,
    setAddressesPerPage,
    addressesCount: addresses.length,
    activeAddressIsValid,
    allAddressesLocked,
    searchQuery,
    setSearchQuery,
    isSearchActive,
    cacheAddressLocation,
  };
}
