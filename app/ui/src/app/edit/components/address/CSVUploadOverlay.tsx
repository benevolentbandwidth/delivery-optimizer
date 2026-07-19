"use client";

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  type CSSProperties,
} from "react";
import {
  OVERLAY_BACKDROP,
  OVERLAY_HEADER,
  OVERLAY_TITLE,
  OVERLAY_CLOSE_BTN,
  OVERLAY_FOOTER,
  OVERLAY_CANCEL_BTN,
  OVERLAY_PRIMARY_BTN,
  CSV_UPLOAD_OVERLAY_PANEL,
  CSV_UPLOAD_OVERLAY_PANEL_TALL,
  CSV_UPLOAD_OVERLAY_INNER,
  CSV_UPLOAD_OVERLAY_CONTENT,
  CSV_UPLOAD_OVERLAY_TOP,
  CSV_UPLOAD_DROP_ZONE,
  CSV_UPLOAD_DROP_ZONE_ACTIVE,
  CSV_UPLOAD_DROP_ZONE_INNER,
  CSV_UPLOAD_DROP_ZONE_PROMPT,
  CSV_UPLOAD_DROP_ZONE_TEXT,
  CSV_UPLOAD_BROWSE_BTN,
  CSV_UPLOAD_DESCRIPTION,
  CSV_UPLOAD_FILE_CHIP,
  CSV_UPLOAD_FILE_CHIP_LEFT,
  CSV_UPLOAD_FILE_CHIP_FILENAME,
  CSV_UPLOAD_FILE_CHIP_RIGHT,
  CSV_UPLOAD_FILE_CHIP_SIZE,
  CSV_UPLOAD_FILE_CHIP_REMOVE,
  OVERLAY_SELECT_WRAPPER,
  OVERLAY_SELECT_VALUE,
  OVERLAY_SELECT_ICON,
  CSV_UPLOAD_SELECT_PLACEHOLDER,
  OVERLAY_AUTOCOMPLETE_DROPDOWN,
  OVERLAY_AUTOCOMPLETE_ITEM,
  OVERLAY_AUTOCOMPLETE_ITEM_ACTIVE,
  OVERLAY_AUTOCOMPLETE_ITEM_TEXT,
} from "@/app/edit/formStyles.v2";
import ErrorOverlay from "@/app/edit/components/shared/ErrorOverlay";
import type { AddressCard } from "@/app/edit/types/delivery";
import { useCSVImport } from "@/app/edit/hooks/useCSVImport";

// ─── Types ────────────────────────────────────────────────────────────────────

type MappableField =
  | "recipientAddress"
  | "deliveryTimeStart"
  | "deliveryTimeEnd"
  | "timeBuffer"
  | "deliveryQuantity"
  | "notes"
  | "";

const FIELD_LABELS: Record<Exclude<MappableField, "">, string> = {
  recipientAddress: "Recipient Address",
  deliveryTimeStart: "Delivery Time Start",
  deliveryTimeEnd: "Delivery Time End",
  timeBuffer: "Time Buffer",
  deliveryQuantity: "Delivery Quantity",
  notes: "Notes",
};

type CSVUploadOverlayProps = {
  onClose: () => void;
  importAddresses: (addresses: AddressCard[]) => void;
  onInvalidFile?: () => void;
  initialFile?: File;
};

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

const MAX_CSV_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAddressCards(
  rows: string[][],
  headers: string[],
  mapping: Record<string, MappableField>,
  selectedIndices: Set<number>,
): AddressCard[] {
  let idCounter = 1;
  return rows
    .filter((_, i) => selectedIndices.has(i))
    .map((row) => {
      const card: AddressCard = {
        id: idCounter++,
        locked: true,
        editingExisting: false,
        recipientAddress: "",
        recipientName: "",
        phoneNumber: "",
        timeBuffer: 0,
        deliveryTimeStart: "",
        deliveryTimeEnd: "",
        deliveryQuantity: 0,
        notes: "",
      };
      headers.forEach((header, colIdx) => {
        const field = mapping[header];
        if (!field) return;
        const val = row[colIdx] ?? "";
        if (field === "deliveryQuantity") {
          card.deliveryQuantity = parseInt(val, 10) || 0;
        } else if (field === "timeBuffer") {
          card.timeBuffer = parseInt(val, 10) || 0;
        } else {
          (card as Record<string, unknown>)[field] = val;
        }
      });
      return card;
    });
}

// ─── Custom mapping dropdown (matches overlay design instead of native <select>) ─

const MAPPING_FIELD_OPTIONS = Object.keys(FIELD_LABELS) as Exclude<
  MappableField,
  ""
>[];

function MappingFieldSelect({
  header,
  value,
  onChange,
}: {
  header: string;
  value: MappableField;
  onChange: (field: MappableField) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (open) {
      const currentIndex = MAPPING_FIELD_OPTIONS.indexOf(
        value as Exclude<MappableField, "">,
      );
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const GAP = 4;
    const MENU_MAX_HEIGHT = 192; // matches max-h-48 on OVERLAY_AUTOCOMPLETE_DROPDOWN
    const spaceBelow = window.innerHeight - r.bottom - GAP;
    const spaceAbove = r.top - GAP;
    const openUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    setMenuStyle(
      openUpward
        ? {
            bottom: window.innerHeight - r.top + GAP,
            left: r.left,
            width: r.width,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove),
          }
        : {
            top: r.bottom + GAP,
            left: r.left,
            width: r.width,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow),
          },
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          Math.min(i + 1, MAPPING_FIELD_OPTIONS.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const chosen = MAPPING_FIELD_OPTIONS[activeIndex];
        if (chosen) {
          onChange(chosen);
          setOpen(false);
        }
      }
    }
    function handleScroll(e: Event) {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, activeIndex, onChange]);

  return (
    <div ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={OVERLAY_SELECT_WRAPPER}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Map ${header} column`}
      >
        <span
          className={
            value ? OVERLAY_SELECT_VALUE : CSV_UPLOAD_SELECT_PLACEHOLDER
          }
        >
          {value ? FIELD_LABELS[value as Exclude<MappableField, "">] : "Select"}
        </span>
        <span className={OVERLAY_SELECT_ICON}>{CHEVRON_DOWN_ICON}</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className={OVERLAY_AUTOCOMPLETE_DROPDOWN}
          role="listbox"
          aria-label={`${header} field options`}
          style={menuStyle}
        >
          {MAPPING_FIELD_OPTIONS.map((f, i) => (
            <div
              key={f}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              role="option"
              aria-selected={f === value}
              className={
                f === value || i === activeIndex
                  ? OVERLAY_AUTOCOMPLETE_ITEM_ACTIVE
                  : OVERLAY_AUTOCOMPLETE_ITEM
              }
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(f);
                setOpen(false);
              }}
            >
              <span className={OVERLAY_AUTOCOMPLETE_ITEM_TEXT}>
                {FIELD_LABELS[f]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Column Mapper ────────────────────────────────────────────────────

function StepColumnMapper({
  headers,
  dataRows,
  mapping,
  onMappingChange,
  onCancel,
  onNext,
}: {
  headers: string[];
  dataRows: string[][];
  mapping: Record<string, MappableField>;
  onMappingChange: (header: string, field: MappableField) => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  const previewRows = dataRows.slice(0, 3);
  const isMapped = Object.values(mapping).includes("recipientAddress");

  return (
    <>
      <div className={CSV_UPLOAD_OVERLAY_CONTENT}>
        <div className={CSV_UPLOAD_OVERLAY_TOP}>
          <div className={OVERLAY_HEADER}>
            <p id="csv-upload-title" className={OVERLAY_TITLE}>
              Import from CSV
            </p>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className={OVERLAY_CLOSE_BTN}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4l16 16M20 4L4 20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <p className="font-normal text-[14px] leading-[1.5] text-[var(--edit-text-secondary)] w-full">
            Match your CSV columns to our fields
          </p>

          <div className="w-full border border-[var(--edit-stone-200)] rounded-[8px] overflow-hidden flex flex-col flex-1 min-h-0">
            <div
              className="grid gap-x-4 px-4 py-3 border-b border-[var(--edit-stone-200)] bg-[var(--edit-bg-primary)]"
              style={{ gridTemplateColumns: "1fr 1.4fr 1fr" }}
            >
              {["CSV column", "Delivery Optimizer column", "Preview"].map(
                (h) => (
                  <span
                    key={h}
                    className="font-normal text-[14px] leading-[1.5] text-[var(--edit-text-primary)]"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {headers.map((header) => (
                <div
                  key={header}
                  className="grid gap-x-4 px-4 py-3 items-center bg-[var(--edit-bg-primary)]"
                  style={{
                    gridTemplateColumns: "1fr 1.4fr 1fr",
                    borderBottom: "1px solid var(--edit-stone-200)",
                  }}
                >
                  <span className="font-normal text-[16px] leading-6 text-[var(--edit-text-primary)]">
                    {header.charAt(0).toUpperCase() + header.slice(1)}
                  </span>

                  <MappingFieldSelect
                    header={header}
                    value={mapping[header] ?? ""}
                    onChange={(field) => onMappingChange(header, field)}
                  />

                  <div className="flex flex-col gap-[2px] overflow-hidden">
                    {previewRows.map((row, i) => {
                      const val = row[headers.indexOf(header)] ?? "—";
                      const fontSize =
                        val.length > 40
                          ? "10px"
                          : val.length > 25
                            ? "11px"
                            : "12px";
                      return (
                        <span
                          key={i}
                          style={{ fontSize }}
                          className="text-[var(--edit-text-secondary)] leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap block"
                        >
                          {val}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={OVERLAY_FOOTER}>
        <button type="button" onClick={onCancel} className={OVERLAY_CANCEL_BTN}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isMapped}
          className={OVERLAY_PRIMARY_BTN}
          style={{
            opacity: isMapped ? 1 : 0.4,
            cursor: isMapped ? "pointer" : "not-allowed",
          }}
        >
          Next
        </button>
      </div>
    </>
  );
}

// ─── Step 2: Row Selector ─────────────────────────────────────────────────────

function StepRowSelector({
  headers,
  dataRows,
  mapping,
  selected,
  onToggleAll,
  onToggleRow,
  onBack,
  onCancel,
  onConfirm,
}: {
  headers: string[];
  dataRows: string[][];
  mapping: Record<string, MappableField>;
  selected: Set<number>;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (index: number) => void;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const mappedHeaders = headers.filter((h) => mapping[h]);
  const allChecked = dataRows.length > 0 && selected.size === dataRows.length;
  const someChecked = selected.size > 0 && !allChecked;
  const COL_MIN = 160;

  return (
    <>
      <div className={CSV_UPLOAD_OVERLAY_CONTENT}>
        <div className={CSV_UPLOAD_OVERLAY_TOP}>
          <div className={OVERLAY_HEADER}>
            <p id="csv-upload-title" className={OVERLAY_TITLE}>
              Import from CSV
            </p>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className={OVERLAY_CLOSE_BTN}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 4l16 16M20 4L4 20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <p className="font-normal text-[14px] leading-[1.5] text-[var(--edit-text-secondary)] w-full">
            Review and select information to import
          </p>

          <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0">
            <table
              className="border-collapse w-full"
              style={{ minWidth: `${52 + mappedHeaders.length * COL_MIN}px` }}
            >
              <thead>
                <tr className="border-b border-[var(--edit-stone-200)]">
                  <th className="w-[52px] px-4 pb-3 text-left sticky left-0 bg-[var(--edit-bg-primary)] z-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={(e) => onToggleAll(e.target.checked)}
                      className="cursor-pointer accent-[var(--edit-teal-300)] w-4 h-4"
                    />
                  </th>
                  {mappedHeaders.map((h) => (
                    <th
                      key={h}
                      style={{ minWidth: `${COL_MIN}px` }}
                      className="pb-3 pr-4 text-left font-semibold text-[13px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap"
                    >
                      {FIELD_LABELS[mapping[h] as Exclude<MappableField, "">] ??
                        h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, i) => {
                  const isChecked = selected.has(i);
                  return (
                    <tr
                      key={i}
                      onClick={() => onToggleRow(i)}
                      className="border-b border-[var(--edit-stone-200)] cursor-pointer transition-colors"
                      style={{
                        background: isChecked
                          ? "var(--edit-container-active)"
                          : "transparent",
                      }}
                    >
                      <td
                        className="px-4 py-3 sticky left-0 z-10"
                        style={{
                          background: isChecked
                            ? "var(--edit-container-active)"
                            : "var(--edit-bg-primary)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleRow(i)}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer accent-[var(--edit-teal-300)] w-4 h-4"
                        />
                      </td>
                      {mappedHeaders.map((h) => {
                        const val = row[headers.indexOf(h)] ?? "—";
                        return (
                          <td
                            key={h}
                            title={val}
                            className="py-3 pr-4 font-normal text-[14px] leading-[1.5] text-[var(--edit-text-primary)] whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{ maxWidth: "240px" }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full gap-4">
        <span className="font-normal text-[14px] leading-[1.5] text-[var(--edit-text-secondary)] shrink-0">
          {selected.size} {selected.size === 1 ? "entry" : "entries"} will be
          imported
        </span>
        <div className={OVERLAY_FOOTER}>
          <button type="button" onClick={onBack} className={OVERLAY_CANCEL_BTN}>
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={OVERLAY_CANCEL_BTN}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={selected.size === 0}
            className={OVERLAY_PRIMARY_BTN}
            style={{
              opacity: selected.size > 0 ? 1 : 0.4,
              cursor: selected.size > 0 ? "pointer" : "not-allowed",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CSVUploadOverlay({
  onClose,
  importAddresses,
  onInvalidFile,
  initialFile,
}: CSVUploadOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(
    initialFile && initialFile.size <= MAX_CSV_BYTES ? initialFile : null,
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(
    initialFile && initialFile.size > MAX_CSV_BYTES
      ? "Your file exceeds 10 MB. Please use a smaller file."
      : null,
  );

  const {
    csvData,
    isImportModalOpen,
    parseError,
    openImportModal,
    closeImportModal,
  } = useCSVImport();

  const headers = useMemo(() => csvData[0] ?? [], [csvData]);
  const dataRows = useMemo(
    () =>
      csvData.slice(1).filter((row) => row.some((cell) => cell.trim() !== "")),
    [csvData],
  );

  const [step, setStep] = useState<1 | 2>(1);

  const mapping = useMemo(
    () => Object.fromEntries(headers.map((h) => [h, "" as MappableField])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headers.join(",")],
  );
  const defaultSelected = useMemo(
    () => new Set(dataRows.map((_, i) => i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headers.join(",")],
  );
  const [selectedOverride, setSelectedOverride] = useState<Set<number> | null>(
    null,
  );
  const [mappingOverride, setMappingOverride] = useState<Record<
    string,
    MappableField
  > | null>(null);

  const headersKey = headers.join(",");
  const prevHeadersKeyRef = useRef<string>("");
  useEffect(() => {
    if (headersKey !== "" && headersKey !== prevHeadersKeyRef.current) {
      prevHeadersKeyRef.current = headersKey;
      setSelectedOverride(null);
      setMappingOverride(null);
      setStep(1);
    }
  }, [headersKey]);

  const activeMapping = mappingOverride ?? mapping;
  const activeSelected = selectedOverride ?? defaultSelected;

  useEffect(() => {
    if (initialFile === undefined) return;
    if (initialFile.size > MAX_CSV_BYTES) {
      setFileSizeError("Your file exceeds 10 MB. Please use a smaller file.");
      setSelectedFile(null);
    } else {
      setFileSizeError(null);
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (initialFile && !hasAutoOpenedRef.current && !isImportModalOpen) {
      hasAutoOpenedRef.current = true;
      openImportModal(initialFile);
    }
  }, [initialFile, isImportModalOpen, openImportModal]);

  function handleClose() {
    setStep(1);
    closeImportModal();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onInvalidFile?.();
    } else if (file.size > MAX_CSV_BYTES) {
      setFileSizeError("Your file exceeds 10 MB. Please use a smaller file.");
      setSelectedFile(null);
    } else {
      setFileSizeError(null);
      setSelectedFile(file);
    }
    e.target.value = "";
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setFileSizeError(null);
  }

  function handleNext() {
    if (!selectedFile) return;
    openImportModal(selectedFile);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0] ?? null;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onInvalidFile?.();
    } else if (file.size > MAX_CSV_BYTES) {
      setFileSizeError("Your file exceeds 10 MB. Please use a smaller file.");
      setSelectedFile(null);
    } else {
      setFileSizeError(null);
      setSelectedFile(file);
    }
  }

  const handleMappingChange = useCallback(
    (header: string, field: MappableField) => {
      setMappingOverride((prev) => ({ ...(prev ?? mapping), [header]: field }));
    },
    [mapping],
  );

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      setSelectedOverride(
        checked ? new Set(dataRows.map((_, i) => i)) : new Set(),
      );
    },
    [dataRows],
  );

  const handleToggleRow = useCallback(
    (index: number) => {
      setSelectedOverride((prev) => {
        const next = new Set(prev ?? defaultSelected);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    [defaultSelected],
  );

  const handleConfirm = useCallback(() => {
    const cards = buildAddressCards(
      dataRows,
      headers,
      activeMapping,
      activeSelected,
    );
    importAddresses(cards);
    onClose();
  }, [
    dataRows,
    headers,
    activeMapping,
    activeSelected,
    importAddresses,
    onClose,
  ]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (parseError) {
    return <ErrorOverlay message={parseError} onClose={closeImportModal} />;
  }

  if (isImportModalOpen) {
    return (
      <div className={OVERLAY_BACKDROP} onClick={handleClose}>
        <div
          className={CSV_UPLOAD_OVERLAY_PANEL_TALL}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-upload-title"
        >
          <div className={CSV_UPLOAD_OVERLAY_INNER}>
            {step === 1 ? (
              <StepColumnMapper
                headers={headers}
                dataRows={dataRows}
                mapping={activeMapping}
                onMappingChange={handleMappingChange}
                onCancel={handleClose}
                onNext={() => setStep(2)}
              />
            ) : (
              <StepRowSelector
                headers={headers}
                dataRows={dataRows}
                mapping={activeMapping}
                selected={activeSelected}
                onToggleAll={handleToggleAll}
                onToggleRow={handleToggleRow}
                onBack={() => setStep(1)}
                onCancel={handleClose}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 0: file pick
  return (
    <div className={OVERLAY_BACKDROP} onClick={handleClose}>
      <div
        className={CSV_UPLOAD_OVERLAY_PANEL}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-upload-title"
      >
        <div className={CSV_UPLOAD_OVERLAY_INNER}>
          <div className={CSV_UPLOAD_OVERLAY_CONTENT}>
            <div className={CSV_UPLOAD_OVERLAY_TOP}>
              <div className={OVERLAY_HEADER}>
                <p id="csv-upload-title" className={OVERLAY_TITLE}>
                  Import from CSV
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className={OVERLAY_CLOSE_BTN}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 4l16 16M20 4L4 20"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div
                className={
                  isDragOver
                    ? CSV_UPLOAD_DROP_ZONE_ACTIVE
                    : CSV_UPLOAD_DROP_ZONE
                }
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={CSV_UPLOAD_DROP_ZONE_INNER}>
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M18.667 31.6112H21.4449V23.7083L24.6116 26.875L26.5557 24.9166L20.0003 18.4721L13.5003 24.9721L15.4587 26.9166L18.667 23.7083V31.6112ZM9.44491 36.6666C8.69491 36.6666 8.04435 36.3912 7.49324 35.8404C6.94241 35.2893 6.66699 34.6387 6.66699 33.8887V6.11123C6.66699 5.36123 6.94241 4.71068 7.49324 4.15956C8.04435 3.60873 8.69491 3.33331 9.44491 3.33331H23.917L33.3337 12.75V33.8887C33.3337 34.6387 33.0582 35.2893 32.5074 35.8404C31.9563 36.3912 31.3057 36.6666 30.5557 36.6666H9.44491ZM22.5282 14.0554V6.11123H9.44491V33.8887H30.5557V14.0554H22.5282Z"
                        fill="var(--edit-primary-icon)"
                      />
                    </svg>
                    <div className={CSV_UPLOAD_DROP_ZONE_PROMPT}>
                      <p className={CSV_UPLOAD_DROP_ZONE_TEXT}>
                        Drag and drop CSV files here, or
                      </p>
                      <button
                        type="button"
                        className={CSV_UPLOAD_BROWSE_BTN}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse files
                      </button>
                    </div>
                  </>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              <p className={CSV_UPLOAD_DESCRIPTION}>
                Import delivery details from a CSV file. Maximum file size of 10
                MB.
              </p>
              {fileSizeError !== null && (
                <div className="flex items-start gap-2 mt-1">
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="text-sm text-[var(--edit-error-border)] flex-1"
                  >
                    {fileSizeError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFileSizeError(null)}
                    aria-label="Dismiss error"
                    className="shrink-0 text-[var(--edit-error-border)] hover:opacity-70 transition-opacity cursor-pointer mt-[2px]"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 1l10 10M11 1L1 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {selectedFile !== null && (
              <div className={CSV_UPLOAD_FILE_CHIP}>
                <div className={CSV_UPLOAD_FILE_CHIP_LEFT}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M11.4729 15.6843C10.4515 16.7056 9.22387 17.2163 7.79001 17.2163C6.35616 17.2163 5.12854 16.7056 4.10716 15.6843C3.08579 14.6629 2.5751 13.4353 2.5751 12.0014C2.5751 10.5675 3.08579 9.33993 4.10716 8.31856L9.55778 2.86794C10.2943 2.13137 11.1782 1.76309 12.2094 1.76309C13.2406 1.76309 14.1245 2.13137 14.8611 2.86794C15.5976 3.60451 15.9659 4.48839 15.9659 5.51959C15.9659 6.55079 15.5976 7.43467 14.8611 8.17124L9.70509 13.3272C9.25333 13.779 8.71318 14.0049 8.08464 14.0049C7.4561 14.0049 6.91595 13.779 6.46419 13.3272C6.01242 12.8755 5.78654 12.3353 5.78654 11.7068C5.78654 11.0782 6.01242 10.5381 6.46419 10.0863L11.9148 4.63571L13.0933 5.81422L7.6427 11.2648C7.51503 11.3925 7.45119 11.5398 7.45119 11.7068C7.45119 11.8737 7.51503 12.021 7.6427 12.1487C7.77037 12.2764 7.91768 12.3402 8.08464 12.3402C8.2516 12.3402 8.39891 12.2764 8.52658 12.1487L13.6826 6.99273C14.0852 6.57043 14.289 6.07693 14.2939 5.51223C14.2988 4.94752 14.095 4.45893 13.6826 4.04645C13.2701 3.63397 12.779 3.42773 12.2094 3.42773C11.6398 3.42773 11.1488 3.63397 10.7363 4.04645L5.28568 9.49707C4.57857 10.1845 4.22747 11.0169 4.23238 11.994C4.23729 12.9712 4.58839 13.8085 5.28568 14.5057C5.97314 15.1932 6.80055 15.5345 7.76791 15.5296C8.73528 15.5247 9.57742 15.1834 10.2943 14.5057L16.0396 8.7605L17.2181 9.93901L11.4729 15.6843Z"
                      fill="var(--edit-primary-icon)"
                    />
                  </svg>
                  <p className={CSV_UPLOAD_FILE_CHIP_FILENAME}>
                    {selectedFile.name}
                  </p>
                </div>
                <div className={CSV_UPLOAD_FILE_CHIP_RIGHT}>
                  <p className={CSV_UPLOAD_FILE_CHIP_SIZE}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    aria-label="Remove file"
                    className={CSV_UPLOAD_FILE_CHIP_REMOVE}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 2.5l11 11M13.5 2.5l-11 11"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={OVERLAY_FOOTER}>
            <button
              type="button"
              onClick={handleClose}
              className={OVERLAY_CANCEL_BTN}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={selectedFile === null}
              className={OVERLAY_PRIMARY_BTN}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
