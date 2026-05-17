"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { SUPPORTED_STATES } from "../constants/supportedRegions";
import OverlayFieldError from "./OverlayFieldError";
import OverlayAutocompleteDropdown from "./OverlayAutocompleteDropdown";
import { useAddressAutocomplete } from "../../components/AddressGeocoder/utils/useAddressAutocomplete";
import type { AddressSuggestion } from "../../components/AddressGeocoder/types";
import {
  OVERLAY_BACKDROP,
  OVERLAY_BODY,
  OVERLAY_CANCEL_BTN,
  OVERLAY_CLOSE_BTN,
  OVERLAY_PRIMARY_BTN,
  OVERLAY_FIELD,
  OVERLAY_FOOTER,
  OVERLAY_FULL_FIELD,
  OVERLAY_HEADER,
  OVERLAY_INPUT,
  OVERLAY_INPUT_ERROR,
  OVERLAY_LABEL,
  OVERLAY_PANEL,
  OVERLAY_REQUIRED_STAR,
  OVERLAY_ROW,
  OVERLAY_SELECT,
  OVERLAY_SELECT_PLACEHOLDER,
  OVERLAY_SELECT_VALUE,
  OVERLAY_SELECT_ICON,
  OVERLAY_SELECT_WRAPPER,
  OVERLAY_SELECT_WRAPPER_ERROR,
  OVERLAY_SCROLL_BODY,
  OVERLAY_TITLE,
  OVERLAY_AUTOCOMPLETE_INPUT_WRAPPER,
} from "../formStyles.v2";
import styles from "../edit.module.css";

const CLOSE_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CHEVRON_DOWN_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const COUNTRIES = ["United States"];

export type LocationAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type AddressOverlayProps = {
  heading: string;
  primaryLabel?: string;
  initialAddress?: Partial<LocationAddress>;
  onClose: () => void;
  onSave: (address: LocationAddress) => void;
};

export default function AddressOverlay({
  heading,
  primaryLabel = "Optimize",  // Default label, overwritten by "Confirm" when called by AddressCard
  initialAddress,
  onClose,
  onSave,
}: AddressOverlayProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);

  const [line1, setLine1] = useState(initialAddress?.line1 ?? "");
  const [line2, setLine2] = useState(initialAddress?.line2 ?? "");
  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [state, setState] = useState(initialAddress?.state ?? "");
  const [zipCode, setZipCode] = useState(initialAddress?.zipCode ?? "");
  const [country, setCountry] = useState(initialAddress?.country ?? "");
  const [submitted, setSubmitted] = useState(false);

  const line1InputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

  const stateFilter = useCallback(
    (s: AddressSuggestion) => SUPPORTED_STATES.has(s.address?.state ?? ""),
    []
  );
  const { suggestions, showSuggestions, selectedIndex, debouncedFetch, clearSuggestions, handleKeyDown: handleAutocompleteKeyDown } =
    useAddressAutocomplete(stateFilter);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions || !line1InputRef.current) return;
    const r = line1InputRef.current.getBoundingClientRect();
    setDropdownStyle({ top: r.bottom + 4, left: r.left, width: r.width });
  }, [showSuggestions]);

  function handleLine1Select(s: AddressSuggestion) {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const a = s.address ?? {};
    const streetLine = [a.house_number, a.road].filter(Boolean).join(" ") || s.display_name;
    setLine1(streetLine);
    setCity(a.city ?? a.town ?? a.village ?? a.municipality ?? "");
    setState(a.state ?? "");
    setZipCode((a.postcode ?? "").slice(0, 5));
    setCountry("United States");
    clearSuggestions();
  }

  const line1Error = submitted && !line1.trim();
  const cityError = submitted && !city.trim();
  const stateError = submitted && !state;
  const zipError = submitted && zipCode.length !== 5;
  const countryError = submitted && !country;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (suggestions.length > 0) return;
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, suggestions]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSave() {
    setSubmitted(true);
    const trimmedLine1 = line1.trim();
    const trimmedCity = city.trim();
    if (!trimmedLine1 || !trimmedCity || !state || zipCode.length !== 5 || !country) return;
    onSave({ line1: trimmedLine1, line2: line2.trim(), city: trimmedCity, state, zipCode, country });
  }

  return (
    <div
      className={OVERLAY_BACKDROP}
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className={OVERLAY_PANEL}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-overlay-title"
        tabIndex={-1}
      >
        <div className={OVERLAY_BODY}>
          {/* Header */}
          <div className={OVERLAY_HEADER}>
            <h2 id="address-overlay-title" className={OVERLAY_TITLE}>
              {heading}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={OVERLAY_CLOSE_BTN}
              aria-label="Close"
            >
              {CLOSE_ICON}
            </button>
          </div>

          {/* Form fields */}
          <div className={OVERLAY_SCROLL_BODY}>
            {/* Address line 1 — full width */}
            <div className={OVERLAY_FULL_FIELD}>
              <label htmlFor="start-loc-line1" className={OVERLAY_LABEL}>
                Address line 1<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
              </label>
              <div className={OVERLAY_AUTOCOMPLETE_INPUT_WRAPPER}>
                <input
                  ref={line1InputRef}
                  id="start-loc-line1"
                  value={line1}
                  onChange={(e) => { setLine1(e.target.value); debouncedFetch(e.target.value); }}
                  onKeyDown={(e) => handleAutocompleteKeyDown(e, handleLine1Select)}
                  onBlur={() => { blurTimeoutRef.current = setTimeout(clearSuggestions, 150); }}
                  placeholder="Street number and name"
                  className={line1Error ? OVERLAY_INPUT_ERROR : OVERLAY_INPUT}
                  aria-required="true"
                  aria-invalid={line1Error}
                  autoComplete="off"
                />
                {showSuggestions && (
                  <OverlayAutocompleteDropdown
                    suggestions={suggestions}
                    selectedIndex={selectedIndex}
                    onSelect={handleLine1Select}
                    style={dropdownStyle}
                  />
                )}
              </div>
              {line1Error && <OverlayFieldError message="Enter an address" />}
            </div>

            {/* Address line 2 — full width, optional */}
            <div className={OVERLAY_FULL_FIELD}>
              <label htmlFor="start-loc-line2" className={OVERLAY_LABEL}>
                Address line 2
              </label>
              <input
                id="start-loc-line2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Apt/Suite/Unit"
                className={OVERLAY_INPUT}
              />
            </div>

            {/* City + State */}
            <div className={OVERLAY_ROW}>
              <div className={OVERLAY_FIELD}>
                <label htmlFor="start-loc-city" className={OVERLAY_LABEL}>
                  City<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <input
                  id="start-loc-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter"
                  className={cityError ? OVERLAY_INPUT_ERROR : OVERLAY_INPUT}
                  aria-required="true"
                  aria-invalid={cityError}
                />
                {cityError && <OverlayFieldError message="Enter a city" />}
              </div>

              <div className={OVERLAY_FIELD}>
                <label htmlFor="start-loc-state" className={OVERLAY_LABEL}>
                  State<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <div className={stateError ? OVERLAY_SELECT_WRAPPER_ERROR : OVERLAY_SELECT_WRAPPER}>
                  <span className={state ? OVERLAY_SELECT_VALUE : OVERLAY_SELECT_PLACEHOLDER}>
                    {state || "Select"}
                  </span>
                  <span className={OVERLAY_SELECT_ICON}>
                    {CHEVRON_DOWN_ICON}
                  </span>
                  <select
                    id="start-loc-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={OVERLAY_SELECT}
                    aria-required="true"
                    aria-invalid={stateError}
                  >
                    <option value="" disabled>Select</option>
                    {[...SUPPORTED_STATES].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {stateError && <OverlayFieldError message="Enter a state" />}
              </div>
            </div>

            {/* Zip code + Country/region */}
            <div className={OVERLAY_ROW}>
              <div className={OVERLAY_FIELD}>
                <label htmlFor="start-loc-zip" className={OVERLAY_LABEL}>
                  Zip code<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <input
                  id="start-loc-zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="Enter"
                  inputMode="numeric"
                  maxLength={5}
                  className={zipError ? OVERLAY_INPUT_ERROR : OVERLAY_INPUT}
                  aria-required="true"
                  aria-invalid={zipError}
                />
                {zipError && <OverlayFieldError message="Zip code must be 5 digits" />}
              </div>

              <div className={OVERLAY_FIELD}>
                <label htmlFor="start-loc-country" className={OVERLAY_LABEL}>
                  Country/region<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <div className={countryError ? OVERLAY_SELECT_WRAPPER_ERROR : OVERLAY_SELECT_WRAPPER}>
                  <span className={country ? OVERLAY_SELECT_VALUE : OVERLAY_SELECT_PLACEHOLDER}>
                    {country || "Select"}
                  </span>
                  <span className={OVERLAY_SELECT_ICON}>
                    {CHEVRON_DOWN_ICON}
                  </span>
                  <select
                    id="start-loc-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={OVERLAY_SELECT}
                    aria-required="true"
                    aria-invalid={countryError}
                  >
                    <option value="" disabled>Select</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {countryError && <OverlayFieldError message="Enter a valid region" />}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={OVERLAY_FOOTER}>
          <button type="button" onClick={onClose} className={OVERLAY_CANCEL_BTN}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className={`${OVERLAY_PRIMARY_BTN} ${styles.primaryBtnOverlay}`}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
