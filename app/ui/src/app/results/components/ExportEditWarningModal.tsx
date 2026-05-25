"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { MODAL_OVERLAY } from "@/app/edit/formStyles";
import editStyles from "@/app/edit/edit.module.css";
import { useFocusTrap } from "@/app/edit/hooks/useFocusTrap";
import { useIsClient } from "@/app/edit/hooks/useIsClient";

type ExportEditWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDoneEditing: () => void;
};

export default function ExportEditWarningModal({
  isOpen,
  onClose,
  onDoneEditing,
}: ExportEditWarningModalProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <ExportEditWarningModalPanel
      onClose={onClose}
      onDoneEditing={onDoneEditing}
    />,
    document.body,
  );
}

type ExportEditWarningModalPanelProps = {
  onClose: () => void;
  onDoneEditing: () => void;
};

function ExportEditWarningModalPanel({
  onClose,
  onDoneEditing,
}: ExportEditWarningModalPanelProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  return (
    <div
      className={`${MODAL_OVERLAY} ${editStyles.root} font-sans-manrope`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-edit-warning-title"
        className="relative mx-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2
          id="export-edit-warning-title"
          className="pr-10 text-lg font-semibold text-zinc-900"
        >
          Edit Mode Active
        </h2>

        <div
          className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5"
          role="alert"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            Unable to export while currently editing
          </p>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-800">
          Please save your changes before exporting routes. This ensures the
          exported data matches your current view.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold text-zinc-800 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDoneEditing}
            className="h-9 rounded-md bg-[var(--edit-teal-400)] px-4 text-sm font-semibold text-[var(--edit-foreground)] hover:brightness-[0.97]"
          >
            Done editing
          </button>
        </div>
      </div>
    </div>
  );
}
