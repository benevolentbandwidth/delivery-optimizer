"use client";

import { useLayoutEffect, useRef, useState } from "react";
import AddressOverlay, { type LocationAddress } from "./AddressOverlay";
import { TIME_OPTIONS } from "../constants/timeOptions";
import type { AddressCard as AddressCardType } from "../types/delivery";
import {
  ADDRESS_ROW_EDIT_ROOT,
  ADDRESS_ROW_DESKTOP_WRAPPER,
  ADDRESS_ROW_EDIT_LEFT,
  ADDRESS_ROW_EDIT_COLS,
  ADDRESS_ROW_RECIPIENT_COL,
  ADDRESS_ROW_NAME_ROW,
  ADDRESS_ROW_FIELD_INPUT_FILL,
  ADDRESS_ROW_ADDR_WRAP,
  ADDRESS_ROW_ADDR_WRAP_ERROR,
  ADDRESS_ROW_ADDR_GRADIENT,
  ADDRESS_ROW_ADDR_TRIGGER_TEXT,
  ADDRESS_ROW_ADDR_TRIGGER_PLACEHOLDER,
  ADDRESS_ROW_STEPPER_CONTAINER_NARROW,
  ADDRESS_ROW_STEPPER_INPUT,
  ADDRESS_ROW_STEPPER_CONTROLS,
  ADDRESS_ROW_STEPPER_BUTTON,
  ADDRESS_ROW_STEPPER_BUTTON_BORDER,
  ADDRESS_ROW_ICON_FILL,
  ADDRESS_ROW_EST_GROUP,
  ADDRESS_ROW_TIME_GROUP,
  ADDRESS_ROW_TIME_SELECT_WRAP,
  ADDRESS_ROW_TIME_SELECT,
  ADDRESS_ROW_INLINE_TEXT,
  ADDRESS_ROW_TIME_SELECT_TEXT,
  ADDRESS_ROW_TIME_SELECT_CHEVRON,
  ADDRESS_ROW_NOTES_WRAP,
  ADDRESS_ROW_NOTES_TEXTAREA,
  ADDRESS_ROW_ACTIONS,
  ADDRESS_ROW_LOCKED_RECIPIENT_COL,
  ADDRESS_ROW_LOCKED_PLAIN_TEXT,
  ADDRESS_ROW_LOCKED_FIELD_BTN,
  ADDRESS_ROW_LOCKED_CELL_DELIVERY_EST,
  ADDRESS_ROW_LOCKED_CELL_QUANTITY,
  ADDRESS_ROW_LOCKED_CELL_DELIVERY_TIME,
  ADDRESS_ROW_LOCKED_NOTES_BTN,
  ADDRESS_ROW_LOCKED_NOTES_TEXT,
  ADDRESS_ROW_GEOCODE_ERROR_LOCKED,
  MOBILE_ADDR_CARD_EDIT_CONTENT,
  MOBILE_ADDR_EDIT_SECTION,
  MOBILE_ADDR_EDIT_SECTION_LABEL,
  MOBILE_ADDR_EDIT_NAME_ROW,
  MOBILE_ADDR_EDIT_DELIVERY_INFO_ROW,
  MOBILE_ADDR_EDIT_DELIVERY_GROUP,
  MOBILE_ADDR_EDIT_EST_CONTROL,
  MOBILE_ADDR_EDIT_SCHEDULE_ROW,
  MOBILE_ADDR_EDIT_TIME_SELECT_WRAP,
  MOBILE_ADDR_EDIT_NOTES_WRAP,
  MOBILE_ADDR_EDIT_ACTION_BAR,
  MOBILE_ADDR_EDIT_ACTION_BAR_END,
  MOBILE_ADDR_EDIT_COLLAPSE_BTN,
  MOBILE_ADDR_EDIT_ICON_BTNS_GROUP,
  MOBILE_ADDR_LOCKED_VALUE,
  MOBILE_ADDR_LOCKED_FIELD_BTN,
  MOBILE_ADDR_LOCKED_RECIPIENT_LINES,
  MOBILE_ADDR_LOCKED_GEOCODE_ERROR,
  MOBILE_ADDR_SUMMARY_CONTENT,
  MOBILE_ADDR_SUMMARY_SECTION,
  MOBILE_ADDR_SUMMARY_ACTION_BAR,
  MOBILE_ADDR_SUMMARY_EXPAND_BTN,
  ADDRESS_CARD_MOBILE_ROOT,
  MOBILE_ADDR_EXPANDED_PANEL,
  MOBILE_ADDR_LOCKED_NOTES_CLAMP,
} from "../formStyles.v2";
import { EditIconButton, ConfirmIconButton, DeleteIconButton } from "./RowIconButtons";

function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parseRecipientAddress(addr: string): Partial<LocationAddress> {
  const parts = addr.split(", ");
  if (parts.length < 4) return {};
  const country = parts[parts.length - 1];
  const stateZip = parts[parts.length - 2];
  const city = parts[parts.length - 3];
  const lastSpace = stateZip.lastIndexOf(" ");
  const state = lastSpace > -1 ? stateZip.slice(0, lastSpace) : "";
  const zipCode = lastSpace > -1 ? stateZip.slice(lastSpace + 1) : stateZip;
  const line1 = parts[0];
  const line2 = parts.length >= 5 ? parts[1] : "";
  return { line1, line2, city, state, zipCode, country };
}

type AddressCardProps = {
  address: AddressCardType;
  updateAddress: <K extends keyof AddressCardType>(id: number, key: K, value: AddressCardType[K]) => void;
  deleteAddress: (id: number) => void;
  unlockAddress: (id: number) => void;
  confirmAddress: (id: number) => void;
  addressTouched: boolean;
  geocodeFailed: boolean;
  outOfRegionFailed: boolean;
};

function StepperInput({
  value,
  min = 0,
  ariaLabel,
  onIncrement,
  onDecrement,
  onChange,
}: {
  value: number;
  min?: number;
  ariaLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <div className={ADDRESS_ROW_STEPPER_CONTAINER_NARROW}>
      <input
        type="number"
        min={min}
        value={value || ""}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? min : Math.max(min, parsed));
        }}
        aria-label={ariaLabel}
        className={ADDRESS_ROW_STEPPER_INPUT}
      />
      <div className={ADDRESS_ROW_STEPPER_CONTROLS}>
        <button type="button" onClick={onIncrement} aria-label={`Increase ${ariaLabel}`} className={ADDRESS_ROW_STEPPER_BUTTON}>
          <svg viewBox="0 0 24 12" width="24" height="12">
            <path fill="none" className={ADDRESS_ROW_STEPPER_BUTTON_BORDER} d="M6 0.5H18C21.0376 0.5 23.5 2.96243 23.5 6V11.5H0.5V6C0.5 2.96243 2.96243 0.5 6 0.5Z" />
            <path className={ADDRESS_ROW_ICON_FILL} d="M12 5.39189L8.93333 8.5L8 7.55405L12 3.5L16 7.55405L15.0667 8.5L12 5.39189Z" />
          </svg>
        </button>
        <button type="button" onClick={onDecrement} aria-label={`Decrease ${ariaLabel}`} className={ADDRESS_ROW_STEPPER_BUTTON}>
          <svg viewBox="0 0 24 12" width="24" height="12">
            <path fill="none" className={ADDRESS_ROW_STEPPER_BUTTON_BORDER} d="M18 11.5H6C2.96243 11.5 0.5 9.03757 0.5 6V0.5H23.5V6C23.5 9.03757 21.0376 11.5 18 11.5Z" />
            <path className={ADDRESS_ROW_ICON_FILL} d="M12 6.60811L8.93333 3.5L8 4.44595L12 8.5L16 4.44595L15.0667 3.5L12 6.60811Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AutoResizeNotesTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter notes"
      aria-label="Notes"
      rows={1}
      className={ADDRESS_ROW_NOTES_TEXTAREA}
    />
  );
}

export default function AddressCard({
  address: a,
  updateAddress,
  deleteAddress,
  unlockAddress,
  confirmAddress,
  addressTouched,
  geocodeFailed,
  outOfRegionFailed,
}: AddressCardProps) {
  const [manualExpanded, setManualExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const expanded = !a.locked || manualExpanded;

  const startIdx = TIME_OPTIONS.indexOf(a.deliveryTimeStart);
  const endIdx = TIME_OPTIONS.indexOf(a.deliveryTimeEnd);

  const addrInvalid = geocodeFailed || (addressTouched && !a.recipientAddress.trim());

  const panelId = `addr-panel-${a.id}`;

  return (
    <>
      {/* ── Desktop hi-fi layout ── */}
      <div className={ADDRESS_ROW_DESKTOP_WRAPPER}>
        <div className={ADDRESS_ROW_EDIT_ROOT}>
          {/* Left: all columns */}
          <div className={ADDRESS_ROW_EDIT_LEFT}>
            {/* Data columns */}
            <div className={ADDRESS_ROW_EDIT_COLS}>
              {a.locked ? (
                <>
                  {/* Recipient column — locked */}
                  <div className={ADDRESS_ROW_LOCKED_RECIPIENT_COL}>
                    {(a.recipientName || a.phoneNumber) && (
                      <button type="button" onClick={() => unlockAddress(a.id)} className={`${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN}`}>
                        {[a.recipientName, a.phoneNumber].filter(Boolean).join(", ")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { unlockAddress(a.id); setOverlayOpen(true); }}
                      className={`${ADDRESS_ROW_LOCKED_PLAIN_TEXT} ${ADDRESS_ROW_LOCKED_FIELD_BTN}${geocodeFailed || outOfRegionFailed ? ` ${ADDRESS_ROW_GEOCODE_ERROR_LOCKED}` : ""}`}
                    >
                      {a.recipientAddress || "—"}
                    </button>
                  </div>

                  {/* Quantity — locked */}
                  <button type="button" onClick={() => unlockAddress(a.id)} className={ADDRESS_ROW_LOCKED_CELL_QUANTITY}>
                    {a.deliveryQuantity}
                  </button>

                  {/* Delivery estimation — locked */}
                  <button type="button" onClick={() => unlockAddress(a.id)} className={ADDRESS_ROW_LOCKED_CELL_DELIVERY_EST}>
                    {a.timeBuffer > 0 ? `${a.timeBuffer} minutes` : "—"}
                  </button>

                  {/* Delivery time — locked */}
                  <button type="button" onClick={() => unlockAddress(a.id)} className={ADDRESS_ROW_LOCKED_CELL_DELIVERY_TIME}>
                    {a.deliveryTimeStart && a.deliveryTimeEnd
                      ? `${a.deliveryTimeStart} – ${a.deliveryTimeEnd}`
                      : a.deliveryTimeStart || a.deliveryTimeEnd || "—"}
                  </button>

                  {/* Notes — locked */}
                  <button type="button" onClick={() => unlockAddress(a.id)} className={ADDRESS_ROW_LOCKED_NOTES_BTN}>
                    <span className={ADDRESS_ROW_LOCKED_NOTES_TEXT}>
                      {a.notes || "—"}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* Recipient column — edit */}
                  <div className={ADDRESS_ROW_RECIPIENT_COL}>
                    <div className={ADDRESS_ROW_NAME_ROW}>
                      <input
                        value={a.recipientName}
                        onChange={(e) => updateAddress(a.id, "recipientName", e.target.value)}
                        placeholder="First and last name"
                        aria-label="Recipient name"
                        maxLength={50}
                        className={ADDRESS_ROW_FIELD_INPUT_FILL}
                      />
                      <input
                        value={a.phoneNumber}
                        onChange={(e) => updateAddress(a.id, "phoneNumber", formatPhoneNumber(e.target.value))}
                        placeholder="123-456-7890"
                        aria-label="Phone number"
                        type="tel"
                        inputMode="numeric"
                        maxLength={12}
                        className={ADDRESS_ROW_FIELD_INPUT_FILL}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverlayOpen(true)}
                      className={addrInvalid ? ADDRESS_ROW_ADDR_WRAP_ERROR : ADDRESS_ROW_ADDR_WRAP}
                      aria-label="Edit recipient address"
                    >
                      <span className={ADDRESS_ROW_ADDR_TRIGGER_TEXT}>
                        {a.recipientAddress || <span className={ADDRESS_ROW_ADDR_TRIGGER_PLACEHOLDER}>Enter address</span>}
                      </span>
                      <div className={ADDRESS_ROW_ADDR_GRADIENT} aria-hidden>
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path
                            className={ADDRESS_ROW_ICON_FILL}
                            d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Quantity — edit */}
                  <StepperInput
                    value={a.deliveryQuantity}
                    min={1}
                    ariaLabel="Delivery quantity"
                    onChange={(v) => updateAddress(a.id, "deliveryQuantity", v)}
                    onIncrement={() => updateAddress(a.id, "deliveryQuantity", (a.deliveryQuantity || 0) + 1)}
                    onDecrement={() => updateAddress(a.id, "deliveryQuantity", Math.max(1, (a.deliveryQuantity || 1) - 1))}
                  />

                  {/* Delivery estimation — edit */}
                  <div className={ADDRESS_ROW_EST_GROUP}>
                    <StepperInput
                      value={a.timeBuffer}
                      min={0}
                      ariaLabel="Delivery estimation in minutes"
                      onChange={(v) => updateAddress(a.id, "timeBuffer", v)}
                      onIncrement={() => updateAddress(a.id, "timeBuffer", (a.timeBuffer || 0) + 1)}
                      onDecrement={() => updateAddress(a.id, "timeBuffer", Math.max(0, (a.timeBuffer || 0) - 1))}
                    />
                    <span className={ADDRESS_ROW_INLINE_TEXT}>minutes</span>
                  </div>

                  {/* Delivery time — edit */}
                  <div className={ADDRESS_ROW_TIME_GROUP}>
                    <div className={ADDRESS_ROW_TIME_SELECT_WRAP}>
                      <select
                        value={a.deliveryTimeStart}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          updateAddress(a.id, "deliveryTimeStart", newStart);
                          if (endIdx !== -1 && TIME_OPTIONS.indexOf(newStart) >= endIdx) {
                            updateAddress(a.id, "deliveryTimeEnd", "");
                          }
                        }}
                        aria-label="Delivery time start"
                        className={ADDRESS_ROW_TIME_SELECT}
                      >
                        <option value="">Start</option>
                        {TIME_OPTIONS.filter((_, i) => endIdx === -1 || i < endIdx).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className={ADDRESS_ROW_TIME_SELECT_TEXT}>
                        {a.deliveryTimeStart || "Start"}
                      </span>
                      <svg viewBox="0 0 24 24" width="24" height="24" className={ADDRESS_ROW_TIME_SELECT_CHEVRON} aria-hidden>
                        <path className={ADDRESS_ROW_ICON_FILL} d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z" />
                      </svg>
                    </div>
                    <span className={ADDRESS_ROW_INLINE_TEXT} aria-hidden>–</span>
                    <div className={ADDRESS_ROW_TIME_SELECT_WRAP}>
                      <select
                        value={a.deliveryTimeEnd}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          updateAddress(a.id, "deliveryTimeEnd", newEnd);
                          if (startIdx !== -1 && TIME_OPTIONS.indexOf(newEnd) <= startIdx) {
                            updateAddress(a.id, "deliveryTimeStart", "");
                          }
                        }}
                        aria-label="Delivery time end"
                        className={ADDRESS_ROW_TIME_SELECT}
                      >
                        <option value="">End</option>
                        {TIME_OPTIONS.filter((_, i) => startIdx === -1 || i > startIdx).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className={ADDRESS_ROW_TIME_SELECT_TEXT}>
                        {a.deliveryTimeEnd || "End"}
                      </span>
                      <svg viewBox="0 0 24 24" width="24" height="24" className={ADDRESS_ROW_TIME_SELECT_CHEVRON} aria-hidden>
                        <path className={ADDRESS_ROW_ICON_FILL} d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Notes — edit */}
                  <div className={ADDRESS_ROW_NOTES_WRAP}>
                    <AutoResizeNotesTextarea
                      value={a.notes}
                      onChange={(value) => updateAddress(a.id, "notes", value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className={ADDRESS_ROW_ACTIONS}>
            {a.locked ? (
              <EditIconButton onClick={() => unlockAddress(a.id)} />
            ) : (
              <ConfirmIconButton onClick={() => confirmAddress(a.id)} />
            )}
            <DeleteIconButton onClick={() => deleteAddress(a.id)} />
          </div>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className={ADDRESS_CARD_MOBILE_ROOT}>
        {!expanded ? (
          /* Summarized state (Figma 8325:7892) */
          <div className={MOBILE_ADDR_SUMMARY_CONTENT}>
            <div className={MOBILE_ADDR_SUMMARY_SECTION}>
              <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Recipient</span>
              <div className={MOBILE_ADDR_LOCKED_RECIPIENT_LINES}>
                {(a.recipientName || a.phoneNumber) && (
                  <span className={MOBILE_ADDR_LOCKED_VALUE}>
                    {[a.recipientName, a.phoneNumber].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className={`${MOBILE_ADDR_LOCKED_VALUE}${geocodeFailed || outOfRegionFailed ? ` ${MOBILE_ADDR_LOCKED_GEOCODE_ERROR}` : ""}`}>
                  {a.recipientAddress || "—"}
                </span>
              </div>
            </div>
            <div className={MOBILE_ADDR_SUMMARY_ACTION_BAR}>
              <button
                type="button"
                onClick={() => setManualExpanded(true)}
                className={MOBILE_ADDR_SUMMARY_EXPAND_BTN}
                aria-label="Expand address card"
                aria-expanded={false}
                aria-controls={panelId}
              >
                Expand
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 12.6L16.6 8L18 9.4L12 15.4L6 9.4L7.4 8L12 12.6Z" fill="var(--edit-primary-icon)" />
                </svg>
              </button>
              <div className={MOBILE_ADDR_EDIT_ICON_BTNS_GROUP}>
                <EditIconButton onClick={() => unlockAddress(a.id)} />
                <DeleteIconButton onClick={() => deleteAddress(a.id)} />
              </div>
            </div>
          </div>
        ) : (
          <div id={panelId} role="region" className={MOBILE_ADDR_EXPANDED_PANEL}>
            {a.locked ? (
              <div className={MOBILE_ADDR_CARD_EDIT_CONTENT}>

                {/* Recipient */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Recipient</span>
                  <button type="button" onClick={() => unlockAddress(a.id)} className={MOBILE_ADDR_LOCKED_FIELD_BTN}>
                    <div className={MOBILE_ADDR_LOCKED_RECIPIENT_LINES}>
                      {(a.recipientName || a.phoneNumber) && (
                        <span className={MOBILE_ADDR_LOCKED_VALUE}>
                          {[a.recipientName, a.phoneNumber].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className={`${MOBILE_ADDR_LOCKED_VALUE}${geocodeFailed || outOfRegionFailed ? ` ${MOBILE_ADDR_LOCKED_GEOCODE_ERROR}` : ""}`}>
                        {a.recipientAddress || "—"}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Delivery Info */}
                <div className={MOBILE_ADDR_EDIT_DELIVERY_INFO_ROW}>
                  <div className={MOBILE_ADDR_EDIT_DELIVERY_GROUP}>
                    <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Quantity</span>
                    <button type="button" onClick={() => unlockAddress(a.id)} className={MOBILE_ADDR_LOCKED_FIELD_BTN}>
                      <span className={MOBILE_ADDR_LOCKED_VALUE}>{a.deliveryQuantity || "—"}</span>
                    </button>
                  </div>
                  <div className={MOBILE_ADDR_EDIT_DELIVERY_GROUP}>
                    <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Delivery estimation</span>
                    <button type="button" onClick={() => unlockAddress(a.id)} className={MOBILE_ADDR_LOCKED_FIELD_BTN}>
                      <span className={MOBILE_ADDR_LOCKED_VALUE}>
                        {a.timeBuffer > 0 ? `${a.timeBuffer} minutes` : "—"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Schedule Delivery */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Schedule Delivery</span>
                  <button type="button" onClick={() => unlockAddress(a.id)} className={MOBILE_ADDR_LOCKED_FIELD_BTN}>
                    <span className={MOBILE_ADDR_LOCKED_VALUE}>
                      {a.deliveryTimeStart && a.deliveryTimeEnd
                        ? `${a.deliveryTimeStart} – ${a.deliveryTimeEnd}`
                        : a.deliveryTimeStart || a.deliveryTimeEnd || "—"}
                    </span>
                  </button>
                </div>

                {/* Notes */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Notes</span>
                  <button type="button" onClick={() => unlockAddress(a.id)} className={MOBILE_ADDR_LOCKED_FIELD_BTN}>
                    <span className={MOBILE_ADDR_LOCKED_NOTES_CLAMP}>
                      {a.notes || "—"}
                    </span>
                  </button>
                </div>

                {/* Action bar */}
                <div className={MOBILE_ADDR_EDIT_ACTION_BAR}>
                  <button type="button" onClick={() => setManualExpanded(false)} className={MOBILE_ADDR_EDIT_COLLAPSE_BTN} aria-label="Collapse card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 11.4L7.4 16L6 14.6L12 8.6L18 14.6L16.6 16L12 11.4Z" fill="var(--edit-primary-icon)" />
                    </svg>
                    Collapse
                  </button>
                  <div className={MOBILE_ADDR_EDIT_ICON_BTNS_GROUP}>
                    <EditIconButton onClick={() => unlockAddress(a.id)} />
                    <DeleteIconButton onClick={() => deleteAddress(a.id)} />
                  </div>
                </div>

              </div>
            ) : (
              <div className={MOBILE_ADDR_CARD_EDIT_CONTENT}>

                {/* Recipient */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Recipient</span>
                  <div className={MOBILE_ADDR_EDIT_NAME_ROW}>
                    <input
                      value={a.recipientName}
                      onChange={(e) => updateAddress(a.id, "recipientName", e.target.value)}
                      placeholder="First and last name"
                      aria-label="Recipient name"
                      maxLength={50}
                      className={ADDRESS_ROW_FIELD_INPUT_FILL}
                    />
                    <input
                      value={a.phoneNumber}
                      onChange={(e) => updateAddress(a.id, "phoneNumber", formatPhoneNumber(e.target.value))}
                      placeholder="123-456-7890"
                      aria-label="Phone number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={12}
                      className={ADDRESS_ROW_FIELD_INPUT_FILL}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverlayOpen(true)}
                    className={addrInvalid ? ADDRESS_ROW_ADDR_WRAP_ERROR : ADDRESS_ROW_ADDR_WRAP}
                    aria-label="Edit recipient address"
                  >
                    <span className={ADDRESS_ROW_ADDR_TRIGGER_TEXT}>
                      {a.recipientAddress || <span className={ADDRESS_ROW_ADDR_TRIGGER_PLACEHOLDER}>Enter address</span>}
                    </span>
                    <div className={ADDRESS_ROW_ADDR_GRADIENT} aria-hidden>
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path className={ADDRESS_ROW_ICON_FILL} d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Delivery Info */}
                <div className={MOBILE_ADDR_EDIT_DELIVERY_INFO_ROW}>
                  <div className={MOBILE_ADDR_EDIT_DELIVERY_GROUP}>
                    <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Quantity</span>
                    <StepperInput
                      value={a.deliveryQuantity}
                      min={1}
                      ariaLabel="Delivery quantity"
                      onChange={(v) => updateAddress(a.id, "deliveryQuantity", v)}
                      onIncrement={() => updateAddress(a.id, "deliveryQuantity", (a.deliveryQuantity || 0) + 1)}
                      onDecrement={() => updateAddress(a.id, "deliveryQuantity", Math.max(1, (a.deliveryQuantity || 1) - 1))}
                    />
                  </div>
                  <div className={MOBILE_ADDR_EDIT_DELIVERY_GROUP}>
                    <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Delivery Estimation</span>
                    <div className={MOBILE_ADDR_EDIT_EST_CONTROL}>
                      <StepperInput
                        value={a.timeBuffer}
                        min={0}
                        ariaLabel="Delivery estimation in minutes"
                        onChange={(v) => updateAddress(a.id, "timeBuffer", v)}
                        onIncrement={() => updateAddress(a.id, "timeBuffer", (a.timeBuffer || 0) + 1)}
                        onDecrement={() => updateAddress(a.id, "timeBuffer", Math.max(0, (a.timeBuffer || 0) - 1))}
                      />
                      <span className={ADDRESS_ROW_INLINE_TEXT}>minutes</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Delivery */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Schedule Delivery</span>
                  <div className={MOBILE_ADDR_EDIT_SCHEDULE_ROW}>
                    <div className={MOBILE_ADDR_EDIT_TIME_SELECT_WRAP}>
                      <select
                        value={a.deliveryTimeStart}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          updateAddress(a.id, "deliveryTimeStart", newStart);
                          if (endIdx !== -1 && TIME_OPTIONS.indexOf(newStart) >= endIdx) {
                            updateAddress(a.id, "deliveryTimeEnd", "");
                          }
                        }}
                        aria-label="Delivery time start"
                        className={ADDRESS_ROW_TIME_SELECT}
                      >
                        <option value="">Start</option>
                        {TIME_OPTIONS.filter((_, i) => endIdx === -1 || i < endIdx).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className={ADDRESS_ROW_TIME_SELECT_TEXT}>
                        {a.deliveryTimeStart || "Start"}
                      </span>
                      <svg viewBox="0 0 24 24" width="24" height="24" className={ADDRESS_ROW_TIME_SELECT_CHEVRON} aria-hidden>
                        <path className={ADDRESS_ROW_ICON_FILL} d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z" />
                      </svg>
                    </div>
                    <span className={ADDRESS_ROW_INLINE_TEXT} aria-hidden>–</span>
                    <div className={MOBILE_ADDR_EDIT_TIME_SELECT_WRAP}>
                      <select
                        value={a.deliveryTimeEnd}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          updateAddress(a.id, "deliveryTimeEnd", newEnd);
                          if (startIdx !== -1 && TIME_OPTIONS.indexOf(newEnd) <= startIdx) {
                            updateAddress(a.id, "deliveryTimeStart", "");
                          }
                        }}
                        aria-label="Delivery time end"
                        className={ADDRESS_ROW_TIME_SELECT}
                      >
                        <option value="">End</option>
                        {TIME_OPTIONS.filter((_, i) => startIdx === -1 || i > startIdx).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className={ADDRESS_ROW_TIME_SELECT_TEXT}>
                        {a.deliveryTimeEnd || "End"}
                      </span>
                      <svg viewBox="0 0 24 24" width="24" height="24" className={ADDRESS_ROW_TIME_SELECT_CHEVRON} aria-hidden>
                        <path className={ADDRESS_ROW_ICON_FILL} d="M14.6 12L10 7.4L11.4 6L17.4 12L11.4 18L10 16.6L14.6 12Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className={MOBILE_ADDR_EDIT_SECTION}>
                  <span className={MOBILE_ADDR_EDIT_SECTION_LABEL}>Notes</span>
                  <div className={MOBILE_ADDR_EDIT_NOTES_WRAP}>
                    <AutoResizeNotesTextarea
                      value={a.notes}
                      onChange={(value) => updateAddress(a.id, "notes", value)}
                    />
                  </div>
                </div>

                {/* Action bar */}
                <div className={MOBILE_ADDR_EDIT_ACTION_BAR_END}>
                  <div className={MOBILE_ADDR_EDIT_ICON_BTNS_GROUP}>
                    <ConfirmIconButton onClick={() => confirmAddress(a.id)} />
                    <DeleteIconButton onClick={() => deleteAddress(a.id)} />
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
      {overlayOpen && (
        <AddressOverlay
          heading="Enter Address"
          primaryLabel="Confirm"
          initialAddress={parseRecipientAddress(a.recipientAddress)}
          onClose={() => setOverlayOpen(false)}
          onSave={(addr: LocationAddress) => {
            const parts = [addr.line1];
            if (addr.line2.trim()) parts.push(addr.line2);
            parts.push(addr.city, `${addr.state} ${addr.zipCode}`, addr.country);
            updateAddress(a.id, "recipientAddress", parts.join(", "));
            setOverlayOpen(false);
          }}
        />
      )}
    </>
  );
}
