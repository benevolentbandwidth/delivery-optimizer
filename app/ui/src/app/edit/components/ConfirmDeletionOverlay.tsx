"use client";

import { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import {
  OVERLAY_BACKDROP,
  OVERLAY_BODY,
  OVERLAY_CANCEL_BTN,
  OVERLAY_DELETE_BTN,
  OVERLAY_CLOSE_BTN,
  OVERLAY_FOOTER,
  OVERLAY_HEADER,
  OVERLAY_LABEL,
  OVERLAY_PANEL,
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

type ConfirmDeletionOverlayProps = {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeletionOverlay({
  title,
  description,
  onClose,
  onConfirm,
}: ConfirmDeletionOverlayProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-body"
        tabIndex={-1}
      >
        <div className={OVERLAY_BODY}>
          <div className={OVERLAY_HEADER}>
            <h2 id="confirm-delete-title" className={OVERLAY_TITLE}>
              {title}
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
          <p id="confirm-delete-body" className={OVERLAY_LABEL}>
            {description}
          </p>
        </div>
        <div className={OVERLAY_FOOTER}>
          <button
            type="button"
            onClick={onClose}
            className={OVERLAY_CANCEL_BTN}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${OVERLAY_DELETE_BTN} ${styles.primaryBtnOverlay}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
