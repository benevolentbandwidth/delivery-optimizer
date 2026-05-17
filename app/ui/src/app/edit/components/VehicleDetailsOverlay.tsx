"use client";

import { useEffect, useRef, useState } from "react";
import type { VehicleRow as VehicleRowType, VehicleType, CapacityUnit } from "../types/delivery";
import { useFocusTrap } from "../hooks/useFocusTrap";
import OverlayFieldError from "./OverlayFieldError";
import {
  OVERLAY_BACKDROP,
  OVERLAY_BODY,
  OVERLAY_CANCEL_BTN,
  OVERLAY_CLOSE_BTN,
  OVERLAY_DEPARTURE_WRAPPER,
  OVERLAY_DEPARTURE_WRAPPER_ERROR,
  OVERLAY_TIME_COLON,
  OVERLAY_TIME_SEGMENT_INPUT,
  OVERLAY_PRIMARY_BTN,
  OVERLAY_FIELD,
  OVERLAY_FOOTER,
  OVERLAY_HEADER,
  OVERLAY_INPUT,
  OVERLAY_INPUT_ERROR,
  OVERLAY_LABEL,
  OVERLAY_MERIDIEM_BTN_ACTIVE,
  OVERLAY_MERIDIEM_BTN_INACTIVE,
  OVERLAY_MERIDIEM_WRAPPER,
  OVERLAY_PANEL,
  OVERLAY_REQUIRED_STAR,
  OVERLAY_ROW,
  OVERLAY_SELECT,
  OVERLAY_SELECT_PLACEHOLDER,
  OVERLAY_SELECT_VALUE,
  OVERLAY_SELECT_ICON,
  OVERLAY_SELECT_WRAPPER,
  OVERLAY_SELECT_WRAPPER_ERROR,
  OVERLAY_STATUS_BADGE_AVAILABLE,
  OVERLAY_STATUS_BADGE_TEXT_AVAILABLE,
  OVERLAY_STATUS_BADGE_TEXT_IN_USE,
  OVERLAY_STATUS_BADGE_IN_USE,
  OVERLAY_STATUS_HINT,
  OVERLAY_STATUS_ROW,
  OVERLAY_SCROLL_BODY,
  OVERLAY_TIME_SEGMENTS,
  OVERLAY_TITLE,
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

function isValidTime(h: string, m: string): boolean {
  const hNum = parseInt(h, 10);
  const mNum = parseInt(m, 10);
  return (
    h.trim() !== "" &&
    m.trim() !== "" &&
    hNum >= 1 && hNum <= 12 &&
    mNum >= 0 && mNum <= 59
  );
}

function parseDepartureTime(time: string): { hours: string; minutes: string; meridiem: "am" | "pm" } {
  if (!time.trim()) return { hours: "", minutes: "", meridiem: "am" };
  const isPm = /pm/i.test(time);
  const cleaned = time.replace(/\s*(am|pm)\s*/i, "").trim();
  const [h = "", m = ""] = cleaned.split(":");
  return { hours: h, minutes: m, meridiem: isPm ? "pm" : "am" };
}

type VehicleDetailsOverlayProps = {
  vehicle: VehicleRowType;
  mode?: "add" | "edit";
  onClose: () => void;
  onSave: (updated: VehicleRowType) => void;
};

export default function VehicleDetailsOverlay({
  vehicle,
  mode = "add",
  onClose,
  onSave,
}: VehicleDetailsOverlayProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);

  const [name, setName] = useState(vehicle.name);
  const [type, setType] = useState<VehicleType | "">(vehicle.type);
  const [capacity, setCapacity] = useState(vehicle.capacity);
  const [capacityUnit, setCapacityUnit] = useState<CapacityUnit | "">(vehicle.capacityUnit);
  const [available, setAvailable] = useState(vehicle.available);

  const parsed = parseDepartureTime(vehicle.departureTime);
  const [hours, setHours] = useState(parsed.hours);
  const [minutes, setMinutes] = useState(parsed.minutes);
  const [meridiem, setMeridiem] = useState<"am" | "pm">(parsed.meridiem);
  const [submitted, setSubmitted] = useState(false);

  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  const nameError     = submitted && !name.trim();
  const typeError     = submitted && !type;
  const capacityError = submitted && capacity <= 0;
  const unitError     = submitted && !capacityUnit;
  const departureError = submitted && !isValidTime(hours, minutes);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    setSubmitted(true);
    if (!name.trim() || !type || capacity <= 0 || !capacityUnit || !isValidTime(hours, minutes)) return;
    const departureTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")} ${meridiem.toUpperCase()}`;
    onSave({ ...vehicle, name, type, capacity, capacityUnit, available, departureTime });
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleCapacityChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCapacity(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0);
  }

  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : null;
  const unitLabel =
    capacityUnit === "cubic_feet"
      ? "Cubic Feet"
      : capacityUnit
        ? capacityUnit.charAt(0).toUpperCase() + capacityUnit.slice(1)
        : null;

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
        aria-labelledby="vehicle-overlay-title"
        tabIndex={-1}
      >
        <div className={OVERLAY_BODY}>
          {/* Header */}
          <div className={OVERLAY_HEADER}>
            <h2 id="vehicle-overlay-title" className={OVERLAY_TITLE}>
              {mode === "edit" ? "Edit vehicle details" : "Add vehicle details"}
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
            {/* Row 1: Name + Type */}
            <div className={OVERLAY_ROW}>
              <div className={OVERLAY_FIELD}>
                <label htmlFor="overlay-vehicle-name" className={OVERLAY_LABEL}>
                  Name<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <input
                  id="overlay-vehicle-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  className={nameError ? OVERLAY_INPUT_ERROR : OVERLAY_INPUT}
                  aria-required="true"
                  aria-invalid={nameError}
                />
                {nameError && <OverlayFieldError message="Enter a name" />}
              </div>

              <div className={OVERLAY_FIELD}>
                <label htmlFor="overlay-vehicle-type" className={OVERLAY_LABEL}>
                  Type<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <div className={typeError ? OVERLAY_SELECT_WRAPPER_ERROR : OVERLAY_SELECT_WRAPPER}>
                  <span className={typeLabel ? OVERLAY_SELECT_VALUE : OVERLAY_SELECT_PLACEHOLDER}>
                    {typeLabel ?? "Select"}
                  </span>
                  <span className={OVERLAY_SELECT_ICON}>
                    {CHEVRON_DOWN_ICON}
                  </span>
                  <select
                    id="overlay-vehicle-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className={OVERLAY_SELECT}
                    aria-required="true"
                    aria-invalid={typeError}
                  >
                    <option value="" disabled>Select</option>
                    <option value="truck">Truck</option>
                    <option value="car">Car</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                {typeError && <OverlayFieldError message="Enter a vehicle type" />}
              </div>
            </div>

            {/* Row 2: Capacity + Unit */}
            <div className={OVERLAY_ROW}>
              <div className={OVERLAY_FIELD}>
                <label htmlFor="overlay-vehicle-capacity" className={OVERLAY_LABEL}>
                  Capacity<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <input
                  id="overlay-vehicle-capacity"
                  type="number"
                  min={0}
                  value={capacity || ""}
                  onChange={handleCapacityChange}
                  placeholder="1500"
                  className={capacityError ? OVERLAY_INPUT_ERROR : OVERLAY_INPUT}
                  aria-required="true"
                  aria-invalid={capacityError}
                />
                {capacityError && <OverlayFieldError message="Enter capacity > 0" />}
              </div>

              <div className={OVERLAY_FIELD}>
                <label htmlFor="overlay-vehicle-unit" className={OVERLAY_LABEL}>
                  Unit<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <div className={unitError ? OVERLAY_SELECT_WRAPPER_ERROR : OVERLAY_SELECT_WRAPPER}>
                  <span className={unitLabel ? OVERLAY_SELECT_VALUE : OVERLAY_SELECT_PLACEHOLDER}>
                    {unitLabel ?? "Select"}
                  </span>
                  <span className={OVERLAY_SELECT_ICON}>
                    {CHEVRON_DOWN_ICON}
                  </span>
                  <select
                    id="overlay-vehicle-unit"
                    value={capacityUnit}
                    onChange={(e) => setCapacityUnit(e.target.value as CapacityUnit)}
                    className={OVERLAY_SELECT}
                    aria-required="true"
                    aria-invalid={unitError}
                  >
                    <option value="" disabled>Select</option>
                    <option value="units">Units</option>
                    <option value="lbs">Lbs</option>
                    <option value="kgs">Kgs</option>
                    <option value="cubic_feet">Cubic Feet</option>
                  </select>
                </div>
                {unitError && <OverlayFieldError message="Enter a unit type" />}
              </div>
            </div>

            {/* Row 3: Status + Departure time */}
            <div className={OVERLAY_ROW}>
              <div className={OVERLAY_FIELD}>
                <span className={OVERLAY_LABEL}>Status</span>
                <div className={OVERLAY_STATUS_ROW}>
                  <button
                    type="button"
                    onClick={() => setAvailable((prev) => !prev)}
                    className={available ? OVERLAY_STATUS_BADGE_AVAILABLE : OVERLAY_STATUS_BADGE_IN_USE}
                    aria-pressed={available}
                    aria-label="Toggle availability"
                  >
                    <span className={available ? OVERLAY_STATUS_BADGE_TEXT_AVAILABLE : OVERLAY_STATUS_BADGE_TEXT_IN_USE}>
                      {available ? "Available" : "In use"}
                    </span>
                  </button>
                  <p className={OVERLAY_STATUS_HINT}>Tap to toggle</p>
                </div>
              </div>

              <div className={OVERLAY_FIELD}>
                <label htmlFor="overlay-departure-time" className={OVERLAY_LABEL}>
                  Departure time<span className={OVERLAY_REQUIRED_STAR} aria-hidden="true">*</span>
                </label>
                <div className={departureError ? OVERLAY_DEPARTURE_WRAPPER_ERROR : OVERLAY_DEPARTURE_WRAPPER}>
                  <div className={OVERLAY_TIME_SEGMENTS}>
                    <input
                      ref={hoursRef}
                      id="overlay-departure-time"
                      value={hours}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setHours(val);
                        if (val.length === 2) minutesRef.current?.focus();
                      }}
                      placeholder="HH"
                      maxLength={2}
                      inputMode="numeric"
                      className={OVERLAY_TIME_SEGMENT_INPUT}
                      aria-required="true"
                      aria-label="Departure hours"
                      aria-invalid={departureError}
                    />
                    <span className={OVERLAY_TIME_COLON}>:</span>
                    <input
                      ref={minutesRef}
                      value={minutes}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setMinutes(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && minutes === "") hoursRef.current?.focus();
                      }}
                      placeholder="MM"
                      maxLength={2}
                      inputMode="numeric"
                      className={OVERLAY_TIME_SEGMENT_INPUT}
                      aria-label="Departure minutes"
                      aria-invalid={departureError}
                    />
                  </div>
                  <div
                    className={OVERLAY_MERIDIEM_WRAPPER}
                    role="group"
                    aria-label="AM or PM"
                  >
                    <button
                      type="button"
                      onClick={() => setMeridiem("am")}
                      className={meridiem === "am" ? OVERLAY_MERIDIEM_BTN_ACTIVE : OVERLAY_MERIDIEM_BTN_INACTIVE}
                      aria-pressed={meridiem === "am"}
                    >
                      am
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeridiem("pm")}
                      className={meridiem === "pm" ? OVERLAY_MERIDIEM_BTN_ACTIVE : OVERLAY_MERIDIEM_BTN_INACTIVE}
                      aria-pressed={meridiem === "pm"}
                    >
                      pm
                    </button>
                  </div>
                </div>
                {departureError && <OverlayFieldError message="Enter a valid time" />}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
