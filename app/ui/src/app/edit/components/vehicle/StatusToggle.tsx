"use client";

import {
  STATUS_TOGGLE_WRAPPER,
  STATUS_TOGGLE_BTN_ACTIVE,
  STATUS_TOGGLE_BTN_INACTIVE,
  STATUS_TOGGLE_TEXT,
} from "@/app/edit/formStyles.v2";

type Props = {
  vehicleId: number;
  available: boolean;
  onUpdate: (id: number, field: "available", value: boolean) => void;
};

export default function StatusToggle({
  vehicleId,
  available,
  onUpdate,
}: Props) {
  return (
    <div
      className={STATUS_TOGGLE_WRAPPER}
      role="group"
      aria-label="Vehicle availability"
    >
      <button
        type="button"
        onClick={() => onUpdate(vehicleId, "available", true)}
        aria-pressed={available === true}
        className={
          available ? STATUS_TOGGLE_BTN_ACTIVE : STATUS_TOGGLE_BTN_INACTIVE
        }
      >
        <span className={STATUS_TOGGLE_TEXT}>Available</span>
      </button>
      <button
        type="button"
        onClick={() => onUpdate(vehicleId, "available", false)}
        aria-pressed={available === false}
        className={
          !available ? STATUS_TOGGLE_BTN_ACTIVE : STATUS_TOGGLE_BTN_INACTIVE
        }
      >
        <span className={STATUS_TOGGLE_TEXT}>In use</span>
      </button>
    </div>
  );
}
