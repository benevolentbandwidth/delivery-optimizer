"use client";

import { useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/app/edit/hooks/useFocusTrap";
import { useIsClient } from "../hooks/useIsClient";

export const EXPORT_METHOD_OPTIONS = [
  {
    id: "whatsapp",
    title: "Send via WhatsApp",
    description:
      "Send each route directly to the driver's phone over WhatsApp, so they can open it on their device without needing a file.",
  },
  {
    id: "json",
    title: "Export Routes",
    description:
      "Download a file per route that you can save, print, or share manually with drivers.",
  },
] as const;

function WhatsAppIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="-1.66 0 740.824 740.824"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M630.056 107.658C560.727 38.271 468.525.039 370.294 0 167.891 0 3.16 164.668 3.079 367.072c-.027 64.699 16.883 127.855 49.016 183.523L0 740.824l194.666-51.047c53.634 29.244 114.022 44.656 175.481 44.682h.151c202.382 0 367.128-164.689 367.21-367.094.039-98.088-38.121-190.32-107.452-259.707m-259.758 564.8h-.125c-54.766-.021-108.483-14.729-155.343-42.529l-11.146-6.613-115.516 30.293 30.834-112.592-7.258-11.543c-30.552-48.58-46.689-104.729-46.665-162.379C65.146 198.865 202.065 62 370.419 62c81.521.031 158.154 31.81 215.779 89.482s89.342 134.332 89.311 215.859c-.07 168.242-136.987 305.117-305.211 305.117m167.415-228.514c-9.176-4.591-54.286-26.782-62.697-29.843-8.41-3.061-14.526-4.591-20.644 4.592-6.116 9.182-23.7 29.843-29.054 35.964-5.351 6.122-10.703 6.888-19.879 2.296-9.175-4.591-38.739-14.276-73.786-45.526-27.275-24.32-45.691-54.36-51.043-63.542-5.352-9.183-.569-14.148 4.024-18.72 4.127-4.11 9.175-10.713 13.763-16.07 4.587-5.356 6.116-9.182 9.174-15.303 3.059-6.122 1.53-11.479-.764-16.07-2.294-4.591-20.643-49.739-28.29-68.104-7.447-17.886-15.012-15.466-20.644-15.746-5.346-.266-11.469-.323-17.585-.323-6.117 0-16.057 2.296-24.468 11.478-8.41 9.183-32.112 31.374-32.112 76.521s32.877 88.763 37.465 94.885c4.587 6.122 64.699 98.771 156.741 138.502 21.891 9.45 38.982 15.093 52.307 19.323 21.981 6.979 41.983 5.994 57.793 3.633 17.628-2.633 54.285-22.19 61.932-43.616 7.646-21.426 7.646-39.791 5.352-43.617-2.293-3.826-8.41-6.122-17.585-10.714"
      />
    </svg>
  );
}

function TextDocumentIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="-3 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19,16 L7,16 C6.448,16 6,16.448 6,17 C6,17.553 6.448,18 7,18 L19,18 C19.552,18 20,17.553 20,17 C20,16.448 19.552,16 19,16 L19,16 Z M19,22 L7,22 C6.448,22 6,22.447 6,23 C6,23.553 6.448,24 7,24 L19,24 C19.552,24 20,23.553 20,23 C20,22.447 19.552,22 19,22 L19,22 Z M20,8 C18.896,8 18,7.104 18,6 L18,2 L24,8 L20,8 L20,8 Z M24,28 C24,29.104 23.104,30 22,30 L4,30 C2.896,30 2,29.104 2,28 L2,4 C2,2.896 2.896,2 4,2 L15.972,2 C15.954,4.395 16,6 16,6 C16,8.209 17.791,10 20,10 L24,10 L24,28 L24,28 Z M18,0 L18,0.028 C17.872,0.028 17.338,-0.021 16,0 L4,0 C1.791,0 0,1.791 0,4 L0,28 C0,30.209 1.791,32 4,32 L22,32 C24.209,32 26,30.209 26,28 L26,8 L18,0 L18,0 Z" />
    </svg>
  );
}

type ExportMethodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendWithWhatsApp: () => void;
  onExportJson: () => void;
};

export default function ExportMethodModal({
  isOpen,
  onClose,
  onSendWithWhatsApp,
  onExportJson,
}: ExportMethodModalProps) {
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
    <ExportMethodModalPanel
      onClose={onClose}
      onSendWithWhatsApp={onSendWithWhatsApp}
      onExportJson={onExportJson}
    />,
    document.body,
  );
}

type ExportMethodModalPanelProps = {
  onClose: () => void;
  onSendWithWhatsApp: () => void;
  onExportJson: () => void;
};

function ExportMethodModalPanel({
  onClose,
  onSendWithWhatsApp,
  onExportJson,
}: ExportMethodModalPanelProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const titleId = useId();
  const descriptionId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  const handleSendWithWhatsApp = useCallback(() => {
    onClose();
    onSendWithWhatsApp();
  }, [onClose, onSendWithWhatsApp]);

  const handleExportJson = useCallback(() => {
    onClose();
    onExportJson();
  }, [onClose, onExportJson]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-sans-manrope"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
            Choose export method
          </h2>
          <p
            id={descriptionId}
            className="mt-1 text-sm leading-snug text-zinc-700"
          >
            Select how you want to share these optimized routes.
          </p>
        </div>

        <div className="grid gap-3 px-5 py-4">
          <button
            type="button"
            onClick={handleSendWithWhatsApp}
            className="group flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-[var(--edit-teal-400)] hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-400)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--edit-btn-primary)] text-[var(--edit-foreground)]">
              <WhatsAppIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-tight text-zinc-900">
                {EXPORT_METHOD_OPTIONS[0].title}
              </span>
              <span className="mt-1 block text-sm leading-snug text-zinc-600">
                {EXPORT_METHOD_OPTIONS[0].description}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="group flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-[var(--edit-teal-400)] hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edit-teal-400)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--edit-stone-700)] bg-white text-[var(--edit-foreground)]">
              <TextDocumentIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-tight text-zinc-900">
                {EXPORT_METHOD_OPTIONS[1].title}
              </span>
              <span className="mt-1 block text-sm leading-snug text-zinc-600">
                {EXPORT_METHOD_OPTIONS[1].description}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
