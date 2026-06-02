"use client";

import {
  ERROR_OVERLAY_FOOTER,
  ERROR_OVERLAY_MESSAGE,
  OVERLAY_BACKDROP,
  OVERLAY_CLOSE_BTN,
  OVERLAY_HEADER,
  OVERLAY_PANEL,
  OVERLAY_PRIMARY_BTN,
  OVERLAY_TITLE,
} from "@/app/edit/formStyles.v2";
import styles from "@/app/edit/edit.module.css";
import { useFocusTrap } from "@/app/edit/hooks/useFocusTrap";

type ErrorOverlayProps = {
  message: string | null;
  onClose: () => void;
};

export default function ErrorOverlay({ message, onClose }: ErrorOverlayProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(!!message);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!message) return null;

  return (
    <div className={OVERLAY_BACKDROP} onKeyDown={handleKeyDown}>
      <div
        ref={panelRef}
        className={OVERLAY_PANEL}
        role="dialog"
        aria-modal={true}
        aria-labelledby="error-overlay-title"
      >
        <div className={OVERLAY_HEADER}>
          <h2 id="error-overlay-title" className={OVERLAY_TITLE}>
            Something went wrong
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={OVERLAY_CLOSE_BTN}
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className={ERROR_OVERLAY_MESSAGE}>{message}</p>
        <div className={ERROR_OVERLAY_FOOTER}>
          <button
            type="button"
            onClick={onClose}
            className={`${OVERLAY_PRIMARY_BTN} ${styles.primaryBtnOverlay}`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
