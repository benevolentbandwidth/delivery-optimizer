"use client";

import type { CSSProperties } from "react";
import type { AddressSuggestion } from "../../components/AddressGeocoder/types";
import {
  OVERLAY_AUTOCOMPLETE_DROPDOWN,
  OVERLAY_AUTOCOMPLETE_HEADER,
  OVERLAY_AUTOCOMPLETE_ITEM,
  OVERLAY_AUTOCOMPLETE_ITEM_ACTIVE,
  OVERLAY_AUTOCOMPLETE_PIN_ICON,
  OVERLAY_AUTOCOMPLETE_ITEM_TEXT,
} from "../formStyles.v2";

const PIN_ICON = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

type Props = {
  suggestions: AddressSuggestion[];
  selectedIndex: number;
  onSelect: (s: AddressSuggestion) => void;
  style: CSSProperties;
};

export default function OverlayAutocompleteDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  style,
}: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className={OVERLAY_AUTOCOMPLETE_DROPDOWN} role="listbox" aria-label="Address suggestions" style={style}>
      <div className={OVERLAY_AUTOCOMPLETE_HEADER} role="presentation">Suggestions</div>
      {suggestions.map((s, idx) => (
        <div
          key={s.place_id}
          role="option"
          aria-selected={idx === selectedIndex}
          className={
            idx === selectedIndex
              ? OVERLAY_AUTOCOMPLETE_ITEM_ACTIVE
              : OVERLAY_AUTOCOMPLETE_ITEM
          }
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s);
          }}
        >
          <span className={OVERLAY_AUTOCOMPLETE_PIN_ICON}>
            {PIN_ICON}
          </span>
          <span className={OVERLAY_AUTOCOMPLETE_ITEM_TEXT}>{s.display_name}</span>
        </div>
      ))}
    </div>
  );
}
