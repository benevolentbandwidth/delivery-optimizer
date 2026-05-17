"use client";

import { VEHICLE_ROW_ICON_BUTTON } from "../formStyles.v2";

type EditIconButtonProps = {
  name?: string;
  onClick: () => void;
};

type DeleteIconButtonProps = {
  name?: string;
  onClick: () => void;
};

export function EditIconButton({ name, onClick }: EditIconButtonProps) {
  return (
    <button
      type="button"
      className={VEHICLE_ROW_ICON_BUTTON}
      onClick={onClick}
      aria-label={`Edit ${name || "vehicle"}`}
      title={`Edit ${name || "vehicle"}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M10 32V28H30V32H10ZM14 24H15.4L23.2 16.225L21.775 14.8L14 22.6V24ZM12 26V21.75L23.2 10.575C23.3833 10.3917 23.5958 10.25 23.8375 10.15C24.0792 10.05 24.3333 10 24.6 10C24.8667 10 25.125 10.05 25.375 10.15C25.625 10.25 25.85 10.4 26.05 10.6L27.425 12C27.625 12.1833 27.7708 12.4 27.8625 12.65C27.9542 12.9 28 13.1583 28 13.425C28 13.675 27.9542 13.9208 27.8625 14.1625C27.7708 14.4042 27.625 14.625 27.425 14.825L16.25 26H12Z" fill="var(--edit-icon-edit)"/>
      </svg>
    </button>
  );
}

export function DeleteIconButton({ name, onClick }: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      className={VEHICLE_ROW_ICON_BUTTON}
      onClick={onClick}
      aria-label={`Delete ${name || "vehicle"}`}
      title={`Delete ${name || "vehicle"}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M15 29C14.45 29 13.9792 28.8042 13.5875 28.4125C13.1958 28.0208 13 27.55 13 27V14H12V12H17V11H23V12H28V14H27V27C27 27.55 26.8042 28.0208 26.4125 28.4125C26.0208 28.8042 25.55 29 25 29H15ZM25 14H15V27H25V14ZM17 25H19V16H17V25ZM21 25H23V16H21V25Z" fill="var(--edit-icon-trash)"/>
      </svg>
    </button>
  );
}
