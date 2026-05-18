"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import {
  createPersistedRouteState,
  loadSessionFromFile,
  loadSessionFromText,
  parsePersistedRouteState,
} from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";
import type { DeliveryStop, DriverRoute } from "@/lib/driver-route/types";

const STORAGE_KEY = "driver_assist.routeState";
const UPLOADED_ROUTE_KEY = "routeFile";

type UploadedRouteFile = {
  name: string;
  content: string;
};

type ReportReason = "Customer unavailable" | "Can't access location" | "Other";

function readSavedRoute(): DriverRoute | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return parsePersistedRouteState(JSON.parse(saved)).route;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function readUploadedRouteFile(): UploadedRouteFile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(UPLOADED_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UploadedRouteFile>;
    if (typeof parsed.name !== "string" || typeof parsed.content !== "string") {
      return null;
    }
    return { name: parsed.name, content: parsed.content };
  } catch {
    return null;
  } finally {
    window.sessionStorage.removeItem(UPLOADED_ROUTE_KEY);
  }
}

function openNavigation(stop: DeliveryStop) {
  const query =
    stop.lat !== 0 || stop.lng !== 0
      ? `${stop.lat},${stop.lng}`
      : encodeURIComponent(stop.address);

  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
}

export default function DriverAssistPwaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const remainingRef = useRef<HTMLDivElement>(null);
  const deliveredRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reportStopId, setReportStopId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("Customer unavailable");
  const [reportDetails, setReportDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const uploadedRoute = readUploadedRouteFile();

    if (uploadedRoute) {
      try {
        const session = loadSessionFromText(uploadedRoute.content);
        const nextRoute = transformSessionToDriverRoute(session);
        setRoute(nextRoute);
        setOpenId(nextRoute.stops[0]?.id || null);
        return;
      } catch (importError) {
        setError(
          importError instanceof Error
            ? importError.message
            : "Please upload a valid JSON file."
        );
      }
    }

    setRoute(readSavedRoute());
  }, []);

  useEffect(() => {
    if (!route) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(createPersistedRouteState(route))
    );
  }, [route]);

  const totals = useMemo(() => {
    const stops = route?.stops || [];
    const completed = stops.filter((stop) => stop.status === "completed").length;
    const failed = stops.filter((stop) => stop.status === "failed").length;
    const pending = stops.filter((stop) => stop.status === "pending").length;

    return {
      completed,
      failed,
      pending,
      total: stops.length,
      progress: stops.length > 0 ? completed / stops.length : 0,
    };
  }, [route]);

  const importRoute = async (file: File) => {
    setError(null);
    setIsImporting(true);

    try {
      const session = await loadSessionFromFile(file);
      const nextRoute = transformSessionToDriverRoute(session);
      setRoute(nextRoute);
      setOpenId(nextRoute.stops[0]?.id || null);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Please upload a valid JSON file."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const updateStop = (stopId: string, changes: Partial<DeliveryStop>) => {
    setRoute((current) => {
      if (!current) return current;

      return {
        ...current,
        stops: current.stops.map((stop) =>
          stop.id === stopId ? { ...stop, ...changes } : stop
        ),
      };
    });
  };

  const resetRoute = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRoute(null);
    setOpenId(null);
    setError(null);
  };

  const openReportDialog = (stopId: string) => {
    setReportStopId(stopId);
    setReportReason("Customer unavailable");
    setReportDetails("");
  };

  const closeReportDialog = () => {
    setReportStopId(null);
    setReportDetails("");
  };

  const submitReport = () => {
    if (!reportStopId) return;
    const reason =
      reportReason === "Other" ? reportDetails.trim() || "Other" : reportReason;

    updateStop(reportStopId, {
      status: "failed",
      failureReason: reason,
    });
    setOpenId(null);
    closeReportDialog();
  };

  const scrollToSection = (target: React.RefObject<HTMLElement | null>) => {
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pendingStops = route?.stops.filter((stop) => stop.status === "pending") || [];
  const deliveredStops =
    route?.stops.filter((stop) => stop.status === "completed") || [];
  const reportedStops =
    route?.stops.filter((stop) => stop.status === "failed") || [];

  if (!route) {
    return (
      <main style={styles.safeArea}>
        <section style={styles.uploadScreen}>
          <h1 style={styles.appHeader}>driver_assist</h1>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            style={styles.hiddenInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importRoute(file);
            }}
          />
          <button
            type="button"
            style={styles.uploadButton}
            onClick={() => inputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? "Uploading..." : "Upload JSON"}
          </button>
          {error ? <p style={styles.errorText}>{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main style={styles.safeArea}>
      <section ref={topRef} style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.appHeader}>Driver Assist</h1>
          <button
            type="button"
            style={styles.iconButton}
            onClick={() => scrollToSection(reportedRef)}
            aria-label="View reported deliveries"
          >
            <WarningIcon />
          </button>
        </div>

        <section style={styles.summaryCard}>
          <div style={styles.statsRow}>
            <StatBlock
              value={totals.total}
              label="Total"
              onClick={() => scrollToSection(topRef)}
            />
            <StatBlock
              value={totals.completed}
              label="Complete"
              onClick={() => scrollToSection(deliveredRef)}
            />
            <StatBlock
              value={totals.pending}
              label="Remaining"
              onClick={() => scrollToSection(remainingRef)}
            />
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${totals.progress * 100}%`,
              }}
            />
          </div>
        </section>

        <section ref={remainingRef} style={styles.routeSection}>
          <h2 style={styles.sectionTitle}>Remaining</h2>

          {pendingStops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              isOpen={openId === stop.id}
              onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
              onChangeNote={(notes) => updateStop(stop.id, { notes })}
              onComplete={() => {
                updateStop(stop.id, {
                  status: "completed",
                  completedAt: new Date().toISOString(),
                });
                setOpenId(null);
              }}
              onReport={() => openReportDialog(stop.id)}
              onNavigate={() => openNavigation(stop)}
            />
          ))}
        </section>

        <section ref={deliveredRef} style={styles.historySection}>
          {deliveredStops.length > 0 ? (
            <>
            <h2 style={styles.historyTitle}>Delivered</h2>
            {deliveredStops.map((stop) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isOpen={openId === stop.id}
                onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
                onChangeNote={(notes) => updateStop(stop.id, { notes })}
                onComplete={() => undefined}
                onReport={() => undefined}
                onNavigate={() => openNavigation(stop)}
              />
            ))}
            </>
          ) : null}
        </section>

        <section ref={reportedRef} style={styles.historySection}>
          {reportedStops.length > 0 ? (
            <>
              <h2 style={styles.historyTitle}>Incomplete delivery</h2>
              {reportedStops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  isOpen={openId === stop.id}
                  onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
                  onChangeNote={(notes) => updateStop(stop.id, { notes })}
                  onComplete={() => undefined}
                  onReport={() => undefined}
                  onNavigate={() => openNavigation(stop)}
                />
              ))}
            </>
          ) : null}
        </section>

        <DriverFooter />
      </section>

      <div style={styles.finishBar}>
        <button type="button" style={styles.finishButton} onClick={resetRoute}>
          Finish
        </button>
      </div>

      {reportStopId ? (
        <ReportIssueDialog
          reason={reportReason}
          details={reportDetails}
          onReasonChange={setReportReason}
          onDetailsChange={setReportDetails}
          onCancel={closeReportDialog}
          onSubmit={submitReport}
        />
      ) : null}
    </main>
  );
}

function StatBlock({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" style={styles.statBlock} onClick={onClick}>
      <strong style={styles.statNumber}>{value}</strong>
      <span style={styles.statLabel}>{label}</span>
    </button>
  );
}

function StopCard({
  stop,
  isOpen,
  onToggle,
  onChangeNote,
  onComplete,
  onReport,
  onNavigate,
}: {
  stop: DeliveryStop;
  isOpen: boolean;
  onToggle: () => void;
  onChangeNote: (value: string) => void;
  onComplete: () => void;
  onReport?: () => void;
  onNavigate?: () => void;
}) {
  const isCompleted = stop.status === "completed";
  const isFailed = stop.status === "failed";
  const isDone = isCompleted || isFailed;
  const completedAtText = stop.completedAt
    ? new Date(stop.completedAt).toLocaleString()
    : null;

  return (
    <article
      style={{
        ...styles.card,
        ...(isCompleted ? styles.completedCard : {}),
        ...(isFailed ? styles.failedCard : {}),
      }}
    >
      <button type="button" style={styles.cardButton} onClick={onToggle}>
        <span style={styles.textBlock}>
          <span style={styles.stopMetaRow}>
            <span style={styles.stopNumberBadge}>{stop.stopNumber}</span>
            <span style={styles.stopWindow}>Deliver between 4:00pm - 5:00pm</span>
          </span>
          <strong style={styles.addressText}>{stop.address}</strong>
          <InfoLine icon={<PersonIcon />} text={stop.customerName} />
          <InfoLine icon={<NoteIcon />} text={stop.notes || "N/A"} />
        </span>
      </button>

      {isOpen ? (
        <div style={styles.expandedSection}>
          <button type="button" style={styles.primaryActionButton} onClick={onNavigate}>
            <NavigateIcon />
            Navigate
          </button>

          {!isDone ? (
            <button type="button" style={styles.deliveredButton} onClick={onComplete}>
              <DeliveredIcon />
              Delivered
            </button>
          ) : null}

          <textarea
            style={styles.noteInput}
            value={stop.notes}
            onChange={(event) => onChangeNote(event.target.value)}
            placeholder="Add delivery note"
          />

          {isCompleted && completedAtText ? (
            <p style={styles.statusText}>Completed at: {completedAtText}</p>
          ) : null}

          {isFailed && stop.failureReason ? (
            <p style={styles.statusText}>Failure reason: {stop.failureReason}</p>
          ) : null}

          {!isDone ? (
            <div style={styles.buttonRow}>
              <button type="button" style={styles.actionButton} onClick={onNavigate}>
                <PhoneIcon />
                Call
              </button>
              <button type="button" style={styles.actionButton} onClick={onReport}>
                <ReportIcon />
                Report issue
              </button>
            </div>
          ) : (
            <button type="button" style={styles.actionButton} onClick={onNavigate}>
              Navigate
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={styles.infoLine}>
      <span style={styles.infoIcon}>{icon}</span>
      <span style={styles.infoText}>{text}</span>
    </span>
  );
}

function DriverFooter() {
  return (
    <footer style={styles.footer}>
      <Image src="/logo.png" alt="b2 logo" width={25} height={28} style={styles.footerLogo} />
      <p style={styles.footerText}>Built with ❤️ for Humanity.</p>
      <p style={styles.footerText}>The Benevolent Bandwidth Foundation</p>
    </footer>
  );
}

function ReportIssueDialog({
  reason,
  details,
  onReasonChange,
  onDetailsChange,
  onCancel,
  onSubmit,
}: {
  reason: ReportReason;
  details: string;
  onReasonChange: (reason: ReportReason) => void;
  onDetailsChange: (details: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const reasons: ReportReason[] = [
    "Customer unavailable",
    "Can't access location",
    "Other",
  ];

  return (
    <div style={styles.modalBackdrop} role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="report-issue-title"
        style={styles.reportDialog}
      >
        <div style={styles.reportHeader}>
          <h2 id="report-issue-title" style={styles.reportTitle}>
            Report issue
          </h2>
          <button
            type="button"
            aria-label="Close report issue"
            style={styles.reportCloseButton}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <p style={styles.reportPrompt}>
          Select a reason for the delivery issue<span style={styles.required}>*</span>
        </p>

        <div style={styles.reportOptions}>
          {reasons.map((option) => (
            <label key={option} style={styles.reportOption}>
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => onReasonChange(option)}
                style={styles.reportRadio}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        {reason === "Other" ? (
          <textarea
            style={styles.reportDetails}
            placeholder="Please provide details"
            value={details}
            onChange={(event) => onDetailsChange(event.target.value)}
          />
        ) : null}

        <div style={styles.reportActions}>
          <button type="button" style={styles.reportCancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" style={styles.reportSubmitButton} onClick={onSubmit}>
            Submit
          </button>
        </div>
      </section>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function NavigateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m12 7 4 10-4-2-4 2 4-10Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function DeliveredIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5h8v3h3v11H5V8h3V5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m9 13 2 2 4-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5 6 7c1 5 6 10 11 11l2-2-4-3-2 2c-2-1-4-3-5-5l2-2-2-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c1.2-4 12.8-4 14 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v16H6V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  safeArea: {
    minHeight: "100dvh",
    backgroundColor: "#ffffff",
    color: "#222222",
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    paddingBottom: "calc(75px + env(safe-area-inset-bottom))",
  },
  uploadScreen: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hiddenInput: {
    display: "none",
  },
  appHeader: {
    fontSize: 14,
    fontWeight: 700,
    color: "#202020",
    margin: 0,
  },
  uploadButton: {
    backgroundColor: "#111827",
    border: 0,
    borderRadius: 8,
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    padding: "14px 20px",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginTop: 14,
    maxWidth: 300,
    textAlign: "center",
  },
  container: {
    width: "100%",
    maxWidth: "none",
    margin: "0 auto",
    padding: "24px 12px 22px",
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 8,
    marginBottom: 20,
    width: "100%",
  },
  iconButton: {
    background: "transparent",
    border: 0,
    color: "#202020",
    cursor: "pointer",
    display: "inline-flex",
    padding: 0,
  },
  summaryCard: {
    marginBottom: 16,
    width: "100%",
  },
  progressTrack: {
    backgroundColor: "#dfdfde",
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#73b99f",
    height: "100%",
  },
  statsRow: {
    alignItems: "center",
    alignSelf: "stretch",
    display: "flex",
    gap: 16,
    justifyContent: "center",
    marginBottom: 21,
  },
  statBlock: {
    alignItems: "center",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    display: "flex",
    flex: "0 0 auto",
    flexDirection: "column",
    font: "inherit",
    padding: 0,
  },
  statNumber: {
    color: "#202020",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    color: "#555555",
    fontSize: 12,
    marginTop: 7,
  },
  sectionTitle: {
    color: "#202020",
    fontSize: 13,
    fontWeight: 700,
    margin: "0 0 7px",
  },
  routeSection: {
    scrollMarginTop: 16,
  },
  card: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    backgroundColor: "#FDFDFC",
    border: "1px solid #DCDBD8",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 10,
    padding: 16,
  },
  completedCard: {
    opacity: 0.68,
  },
  failedCard: {
    backgroundColor: "#fff6f6",
  },
  cardButton: {
    alignItems: "flex-start",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    display: "block",
    font: "inherit",
    padding: 0,
    textAlign: "left",
    width: "100%",
  },
  textBlock: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  stopMetaRow: {
    alignItems: "center",
    display: "flex",
    gap: 6,
    marginBottom: 9,
  },
  stopNumberBadge: {
    alignItems: "center",
    backgroundColor: "#D5F2E8",
    borderRadius: 2,
    color: "#285241",
    display: "inline-flex",
    fontSize: 10,
    height: 18,
    justifyContent: "center",
    lineHeight: 1,
    minWidth: 20,
  },
  stopWindow: {
    color: "#464544",
    fontFamily: "var(--font-manrope), var(--font-geist-sans), Arial, sans-serif",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "normal",
  },
  addressText: {
    color: "#222222",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.35,
    marginBottom: 10,
    overflowWrap: "anywhere",
  },
  infoLine: {
    alignItems: "flex-start",
    color: "#444444",
    display: "flex",
    gap: 7,
    marginTop: 4,
  },
  infoIcon: {
    color: "#2f3432",
    display: "inline-flex",
    flex: "0 0 16px",
  },
  infoText: {
    color: "#444444",
    flex: 1,
    fontSize: 12,
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  expandedSection: {
    marginTop: 13,
    width: "100%",
  },
  metaText: {
    display: "none",
  },
  noteInput: {
    backgroundColor: "#ffffff",
    border: "1px solid #dddddd",
    borderRadius: 5,
    color: "#222222",
    font: "inherit",
    fontSize: 12,
    marginBottom: 8,
    minHeight: 58,
    padding: 8,
    resize: "vertical",
    width: "100%",
  },
  statusText: {
    color: "#374151",
    fontSize: 14,
    margin: "0 0 12px",
  },
  buttonRow: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #eeeeee",
    borderRadius: 8,
    color: "#222222",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 500,
    gap: 6,
    justifyContent: "center",
    minHeight: 42,
    padding: "0 8px",
  },
  primaryActionButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#4CB599",
    border: 0,
    borderRadius: 16,
    color: "#143228",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 500,
    gap: 6,
    justifyContent: "center",
    marginBottom: 7,
    padding: "20px 24px",
    width: "100%",
  },
  deliveredButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #222222",
    borderRadius: 16,
    color: "#222222",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 500,
    gap: 6,
    justifyContent: "center",
    marginBottom: 7,
    padding: "20px 24px",
    width: "100%",
  },
  historySection: {
    marginTop: 29,
    scrollMarginTop: 16,
  },
  historyTitle: {
    color: "#202020",
    fontSize: 13,
    fontWeight: 700,
    margin: "0 0 24px",
  },
  footer: {
    marginTop: 36,
    paddingBottom: 48,
  },
  footerLogo: {
    display: "block",
    height: 28,
    objectFit: "contain",
    width: 25,
  },
  footerText: {
    color: "#202020",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0,
  },
  finishBar: {
    backgroundColor: "#ffffff",
    border: "1px solid #dcdcdc",
    borderBottom: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    bottom: 0,
    left: "50%",
    maxWidth: "none",
    padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
    position: "fixed",
    transform: "translateX(-50%)",
    width: "100%",
  },
  finishButton: {
    backgroundColor: "#4CB599",
    border: 0,
    borderRadius: 999,
    color: "#143228",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    height: 41,
    width: "100%",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    left: 0,
    padding: 12,
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 50,
  },
  reportDialog: {
    alignItems: "flex-start",
    backgroundColor: "#FDFDFC",
    borderRadius: 4,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 24,
    width: 352,
    maxWidth: "calc(100vw - 24px)",
  },
  reportHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  reportTitle: {
    color: "#202020",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.4,
    margin: 0,
  },
  reportCloseButton: {
    alignItems: "center",
    background: "transparent",
    border: 0,
    color: "#202020",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 24,
    height: 28,
    justifyContent: "center",
    lineHeight: 1,
    padding: 0,
    width: 28,
  },
  reportPrompt: {
    color: "#464544",
    fontSize: 12,
    lineHeight: 1.4,
    margin: "8px 0 0",
  },
  required: {
    color: "#C2410C",
  },
  reportOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  reportOption: {
    alignItems: "center",
    border: "1px solid #DCDBD8",
    borderRadius: 4,
    color: "#464544",
    cursor: "pointer",
    display: "flex",
    fontSize: 12,
    gap: 8,
    minHeight: 32,
    padding: "6px 8px",
    width: "100%",
  },
  reportRadio: {
    accentColor: "#464544",
    height: 16,
    margin: 0,
    width: 16,
  },
  reportDetails: {
    border: "1px solid #DCDBD8",
    borderRadius: 4,
    color: "#202020",
    font: "inherit",
    fontSize: 12,
    minHeight: 72,
    padding: 8,
    resize: "vertical",
    width: "100%",
  },
  reportActions: {
    alignItems: "center",
    alignSelf: "stretch",
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  reportCancelButton: {
    backgroundColor: "transparent",
    border: 0,
    color: "#202020",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    minHeight: 36,
    padding: "0 12px",
  },
  reportSubmitButton: {
    backgroundColor: "#4CB599",
    border: 0,
    borderRadius: 4,
    color: "#143228",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    minHeight: 36,
    padding: "0 16px",
  },
};
